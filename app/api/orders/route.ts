import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations/order";
import { resend } from "@/lib/email";


export async function POST(req: Request) {

 try {
    // Ensure the user is authenticated and has the CUSTOMER role
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {
        return NextResponse.json({ error: "Only CUSTOMER can create orders" }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
    }

    // const { products } = parsed.data;
       // ✅ Fetch product details for all items
    const productIds = parsed.data.products.map((i) => i.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
    });

    if( products.length !== parsed.data.products.length) {
        return NextResponse.json({ error: "Some products not found" }, { status: 404 });
    }


    //calculate total amount
    let totalAmount = 0;
    const orderItemsData = parsed.data.products.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const price = product.price;
        totalAmount += Number(price) * item.quantity;

        return {
            productId: item.productId,
            quantity: item.quantity,
            price  
        };
    });

        // Create the order with items
        const order = await prisma.order.create({
            data: {
                userId: session.user.id,
                totalAmount,
                status: "PENDING",
                items: {
                    create: orderItemsData,
                },
            },

            include: {
                items: true
            },

        });


        // ✅ Send confirmation email via Resend
    try {
      await resend.emails.send({
        from: "FarmFresh Marketplace <onboarding@resend.dev>", // change this
        to: session.user.email!, // send to logged-in customer's email
        subject: "Order Confirmation - Farm Fresh Marketplace",
        html: `
          <h2>Thank you for your order!</h2>
          <p>Your order <b>#${order.id}</b> has been placed successfully.</p>
          <p>Total Amount: <b>₹${order.totalAmount}</b></p>
          <p>Status: <b>${order.status}</b></p>
        `,
      });
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      // ⚠ Don’t block order creation if email fails
    }
        
        return NextResponse.json(order, {status: 201});
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}