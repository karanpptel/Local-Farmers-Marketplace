import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"; 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createPaymentSchema } from "@/lib/validations/payment";


export async function POST(request: Request) {

    const session =  await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
    }

    const { orderId } = parsed.data;
   
    //Load order 
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });

    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    //Only the order owner can pay
    if (order.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    //Check if order is already paid
    if (order.status !== "PENDING") {
        return NextResponse.json({ error: "Order is not in a payable state" }, { status: 400 });
    }

    const amountInCents = Math.round(Number(order.totalAmount) * 100);


    // Create a payment intent with Stripe
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
            metadata: { orderId: order.id, userId: order.userId },
        });

        //Record pending payments 

        const payment = await prisma.payment.create({
            data: {
                orderId: order.id,
                stripePaymentId: paymentIntent.id,
                amount: order.totalAmount,
                currency: "usd",
                status: "PENDING",
            },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret, paymentId: payment.id }, { status: 200 });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
    }


}