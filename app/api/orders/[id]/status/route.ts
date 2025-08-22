import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateOrderStatusSchema } from "@/lib/validations/order";
import {prisma} from "@/lib/prisma";

import { resend } from "@/lib/email";
export type props = {
    params: Promise<{ id: string }>;
}
// Update Order status only by FARMER and ADMIN
export async function PUT(req: Request, { params }: props)  {

    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "FARMER") {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


    try {
        const body = await req.json();
        const parsed = updateOrderStatusSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
        }

        const { status  } = parsed.data;

        const updatedOrder = await prisma.order.update({
            where: { id: (await params).id },
            data: { status },
            include: { user: true } // Include user to get email
        });

        if (!updatedOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }


       try {
           await resend.emails.send({
                from: "FarmFresh Marketplace <onboarding@resend.dev>",
                to: updatedOrder.user.email, // Assuming you have user's email in the order
                subject: `Order #${updatedOrder.id} Status Update`,
                html: `
                    <p>Your order status has been updated to: <b>${updatedOrder.status}</b>.</p>
             `,
           });
       } catch (emailError) {
           console.error("Failed to send status update email:", emailError);
           // Don’t fail the entire operation if the notification fails
       }
        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
        
    }
}

