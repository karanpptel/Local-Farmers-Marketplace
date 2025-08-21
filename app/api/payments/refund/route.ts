import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { refundSchema } from "@/lib/validations/payment";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

        const  body = await req.json();
        const parsed = refundSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
        }

        const { paymentId, amount } = parsed.data;

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { order: true },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        //Only the order owner can refund
        if (payment.order.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
            amount: amount ? Math.round(amount * 100) : undefined,
        });

          // We also update to REFUNDED here; webhook will confirm/update again if needed
        await prisma.payment.update({
            where: { id: paymentId },
            data: { status: "REFUNDED" },
        });

        return NextResponse.json({refund: refund }, { status: 200 });
}


