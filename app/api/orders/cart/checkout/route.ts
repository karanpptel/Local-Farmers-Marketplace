// app/api/orders/cart/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email";

// Email retry config (same as your orders route)
const EMAIL_RETRY_ATTEMPTS = 3;
const EMAIL_RETRY_DELAY = 1000;

async function sendEmailWithRetry(emailData: any, attempts = EMAIL_RETRY_ATTEMPTS): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await resend.emails.send(emailData);
      return;
    } catch (error) {
      console.error(`Email attempt ${i + 1} failed:`, error);
      if (i === attempts - 1) throw error;
      await new Promise(res => setTimeout(res, EMAIL_RETRY_DELAY * (i + 1)));
    }
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only CUSTOMER can checkout" }, { status: 403 });
    }

    // Optionally support idempotency header (to avoid double-checkout)
    const idempotencyKey = req.headers.get("idempotency-key");

    if (idempotencyKey) {
      const existing = await prisma.order.findFirst({ where: { idempotencyKey } });
      if (existing) {
        // Return existing order if idempotency key was used earlier
        return NextResponse.json(existing, { status: 200 });
      }
    }

    // Load cart items with product + farmer info
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: { include: { farmer: true } } },
    });

    if (!cartItems.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate stock and build order item data
    let totalAmount = 0;
    const orderItemsData = cartItems.map(ci => {
      const prod = ci.product;
      if (!prod) throw new Error(`Product ${ci.productId} not found`);
      if (prod.stock < ci.quantity) {
        throw new Error(`Insufficient stock for product ${prod.id}`);
      }
      totalAmount += Number(prod.price) * ci.quantity;
      return {
        productId: prod.id,
        quantity: ci.quantity,
        price: prod.price,
      };
    });

    // Transaction: decrement stock, create order, delete cart items
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock safely
      for (const ci of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: ci.productId, stock: { gte: ci.quantity } },
          data: { stock: { decrement: ci.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for product ${ci.productId}`);
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount,
          status: "PENDING",
          idempotencyKey: idempotencyKey ?? undefined,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: session.user.id } });

      return createdOrder;
    });

    // Notify farmers (group items by farmer)
    const farmerMap = new Map<string, { email?: string; items: any[] }>();
    for (const ci of cartItems) {
      const prod = ci.product!;
      if (!prod.farmerId) continue;
      const f = farmerMap.get(prod.farmerId) ?? { email: prod.farmer?.email, items: [] };
      f.items.push({ productId: prod.id, quantity: ci.quantity, price: prod.price });
      farmerMap.set(prod.farmerId, f);
    }

    for (const { email, items } of farmerMap.values()) {
      if (!email) continue;
      try {
        await sendEmailWithRetry({
          from: "FarmFresh Marketplace <no-reply@yourdomain.com>",
          to: email,
          subject: "New Order Received",
          html: `<h2>New Order Placed</h2>
                 <p>Order ID: #${order.id}</p>
                 <ul>${items.map(i => `<li>${i.quantity} x ${i.productId} @ ₹${i.price}</li>`).join("")}</ul>
                 <p>Total: ₹${items.reduce((s, it) => s + Number(it.price) * it.quantity, 0)}</p>`
        });
      } catch (err) {
        console.error("Failed to send farmer email:", email, err);
      }
    }

    // Customer confirmation email
    try {
      await sendEmailWithRetry({
        from: "FarmFresh Marketplace <no-reply@yourdomain.com>",
        to: session.user.email!,
        subject: "Order Confirmation",
        html: `<h2>Thank you for your order!</h2>
               <p>Order #${order.id}</p>
               <ul>${order.items.map(i => `<li>${i.quantity} x ${i.productId} @ ₹${i.price}</li>`).join("")}</ul>
               <p>Total: ₹${order.totalAmount}</p>
               <p>Status: ${order.status}</p>`
      });
    } catch (err) {
      console.error("Failed to send customer email:", err);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/orders/cart/checkout error:", err);
    const message = err?.message || "Failed to checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
