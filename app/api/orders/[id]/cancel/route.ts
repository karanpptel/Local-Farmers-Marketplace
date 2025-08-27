import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";


type paramsType = {
    params:  { id: string }

}

// Handles cancelling an order
export async function PATCH(req: Request, { params }: paramsType) {
  return cancelOrder(req, params);
}

// Support POST as well (so frontend can send POST)
export async function POST(req: Request, { params }: paramsType) {
  return cancelOrder(req, params);
}

async function cancelOrder(req: Request, params: paramsType["params"]) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {items: true},
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only pending orders can be cancelled
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }


     // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }, // rollback stock
      });
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
      include: { 
        user: true, 
        items: { include: { product: true } }, 
        payments: true },
    });

    return NextResponse.json(
      { message: "Order cancelled successfully", cancelledOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
