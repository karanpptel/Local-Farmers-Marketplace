import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type paramsType = {
    params: Promise<{ id: string }>;
};

//get payment by ID
export async function GET(_: Request, { params }: paramsType) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: (await params).id },
            include: { order: true },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        //owner check
        if (payment.order.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        return NextResponse.json(payment);
    } catch (error) {
        console.error("Get Payment by ID error:", error);
        return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
    }
}