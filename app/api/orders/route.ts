import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations/order";
import { resend } from "@/lib/email";

// Email retry config
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
      await new Promise((resolve) => setTimeout(resolve, EMAIL_RETRY_DELAY * (i + 1)));
    }
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only CUSTOMER can create orders" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
    }

    const idempotencyKey = req.headers.get("idempotency-key");
    if (!idempotencyKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
      return NextResponse.json({ error: "Valid idempotency-key header required" }, { status: 400 });
    }

    const recentOrders = await prisma.order.count({
      where: { userId: session.user.id, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    });
    if (recentOrders >= 5) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const existingOrder = await prisma.order.findFirst({ where: { idempotencyKey } });
    if (existingOrder) return NextResponse.json({ error: "Duplicate order" }, { status: 400 });

    // Fetch products
    const productIds = parsed.data.products.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { farmer: true } });
    if (products.length !== parsed.data.products.length) return NextResponse.json({ error: "Some products not found" }, { status: 404 });

    // Prepare order items and total
    let totalAmount = 0;
    const orderItemsData = parsed.data.products.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      totalAmount += Number(product.price) * item.quantity;
      return { productId: item.productId, quantity: item.quantity, price: product.price };
    });

    // Create order & update stock atomically
    const order = await prisma.$transaction(async (tx) => {
      for (const item of parsed.data.products) {
        const updated = await tx.product.update({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
        if (!updated) throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      return await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount,
          status: "PENDING",
          idempotencyKey,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });
    });

    // Multi-farmer emails
    const farmerMap = new Map<string, { email: string; items: any[] }>();
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (!product.farmerId) return;
      if (!farmerMap.has(product.farmerId)) farmerMap.set(product.farmerId, { email: product.farmer.email, items: [] });


      farmerMap.get(product.farmerId)!.items.push(item);
    });

    for (const { email, items } of farmerMap.values()) {
      try {
        await sendEmailWithRetry({
          from: "FarmFresh Marketplace <no-reply@yourdomain.com>",
          to: email,
          subject: "New Order Received",
          html: `<h2>New Order Placed</h2>
                 <p>Order ID: #${order.id}</p>
                 <ul>${items.map(i => `<li>${i.quantity} x ${i.productId} @ ₹${i.price}</li>`).join("")}</ul>
                 <p>Total: ₹${items.reduce((sum, i) => sum + i.price * i.quantity, 0)}</p>`,
        });
      } catch (err) {
        console.error("Failed to send farmer email:", email, err);
      }
    }

    // Customer email
    try {
      await sendEmailWithRetry({
        from: "FarmFresh Marketplace <no-reply@yourdomain.com>",
        to: session.user.email!,
        subject: "Order Confirmation",
        html: `<h2>Thank you for your order!</h2>
               <p>Order #${order.id}</p>
               <ul>${order.items.map(i => `<li>${i.quantity} x ${i.productId} @ ₹${i.price}</li>`).join("")}</ul>
               <p>Total: ₹${order.totalAmount}</p>
               <p>Status: ${order.status}</p>`,
      });
    } catch (err) {
      console.error("Failed to send customer email:", err);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
