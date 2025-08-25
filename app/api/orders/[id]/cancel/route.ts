import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { paramsType } from "../route";

// This route handles cancelling an order by the customer
export async function PUT(req: Request, {params} : paramsType) {

    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        
        const order = await prisma.order.findUnique({
            where: { id: params.id },
        });

        if (!order || order.userId !== session.user.id) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Check if the order is in a cancellable state
       if(order.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 });
       }


        const cancelledOrder = await prisma.order.update({
            where: { id: params.id },
            data: { status: "CANCELLED" },
            include: { user: true, items: { include: { product: true } }, payments: true },
        });

        return NextResponse.json({ message: "Order cancelled successfully", cancelledOrder }, { status: 200 });

    } catch (error) {
        console.error("Error cancelling order:", error);
        return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }
}