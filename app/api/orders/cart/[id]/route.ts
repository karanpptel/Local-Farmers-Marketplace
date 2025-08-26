// app/api/orders/cart/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { prisma } from "@/lib/prisma";
import { updateCartItemSchema } from "@/lib/validations/cart";

export type ParamsType = { params: { id: string } };

export async function PATCH(req: Request, { params }: ParamsType) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
    }

    const cartItem = await prisma.cartItem.findUnique({ where: { id: params.id } });
    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    // Check product stock
    const product = await prisma.product.findUnique({ where: { id: cartItem.productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (product.stock < parsed.data.quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const updated = await prisma.cartItem.update({
      where: { id: params.id },
      data: { quantity: parsed.data.quantity },
    });

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/orders/cart/[id] error:", err);
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: ParamsType) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({ where: { id: params.id } });
    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/orders/cart/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 });
  }
}
