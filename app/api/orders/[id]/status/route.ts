import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateOrderStatusSchema } from "@/lib/validations/order";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email";

// Email retry config
const EMAIL_RETRY_ATTEMPTS = 3;
const EMAIL_RETRY_DELAY = 1000;

async function sendEmailWithRetry(emailData: any, attempts = EMAIL_RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      await resend.emails.send(emailData);
      return;
    } catch (err) {
      console.error(`Email attempt ${i + 1} failed:`, err);
      if (i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, EMAIL_RETRY_DELAY * (i + 1)));
    }
  }
}

export type props = {
  params: { id: string };
}

export async function PUT(req: Request, { params }: props) {
  const session = await getServerSession(authOptions);

  if (!session || !["FARMER", "ADMIN"].includes(session.user?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
    }

    const { status } = parsed.data;

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: { items: { include: { product: { select: { id: true, name: true, farmerId: true } } } }, user: true }

    });

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Notify all farmers involved
    const farmerIds = [...new Set(updatedOrder.items.map(i => i.product.farmerId))];
    const farmers = await prisma.user.findMany({
      where: { id: { in: farmerIds } },
      select: { email: true, name: true }
    });

    for (const farmer of farmers) {
      if (farmer.email) {
        sendEmailWithRetry({
          from: "FarmFresh Marketplace <onboarding@resend.dev>",
          to: farmer.email,
          subject: `Order #${updatedOrder.id} Status Updated`,
          html: `<p>Order #${updatedOrder.id} status changed to <b>${status}</b>.</p>`
        }).catch(err => console.error("Farmer email failed:", err));
      }
    }

    // Notify customer
    if (updatedOrder.user.email) {
      sendEmailWithRetry({
        from: "FarmFresh Marketplace <onboarding@resend.dev>",
        to: updatedOrder.user.email,
        subject: `Your Order #${updatedOrder.id} Status Updated`,
        html: `<p>Your order status has been updated to <b>${status}</b>.</p>`
      }).catch(err => console.error("Customer email failed:", err));
    }

    return NextResponse.json(updatedOrder, { status: 200 });

  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
