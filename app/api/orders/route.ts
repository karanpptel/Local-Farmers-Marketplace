import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations/order";
import { resend } from "@/lib/email";

// Email retry configuration
const EMAIL_RETRY_ATTEMPTS = 3;
const EMAIL_RETRY_DELAY = 1000; // 1 second

async function sendEmailWithRetry(emailData: any, attempts = EMAIL_RETRY_ATTEMPTS): Promise<void> {
    for (let i = 0; i < attempts; i++) {
        try {
            await resend.emails.send(emailData);
            return; // Success, exit retry loop
        } catch (error) {
            console.error(`Email sending attempt ${i + 1} failed:`, error);
            if (i === attempts - 1) {
                // Last attempt failed, could queue for later processing
                console.error("All email retry attempts failed. Consider implementing a queue system.");
                throw error;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, EMAIL_RETRY_DELAY * (i + 1)));
        }
    }
}

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

     // Validate idempotency key format
     const idempotencyKey = req.headers.get('idempotency-key');
     if (!idempotencyKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
         return NextResponse.json({ error: "Valid idempotency-key header (UUID format) is required" }, { status: 400 });
     }

     // Rate limiting: check recent orders (last 5 minutes)
     const recentOrders = await prisma.order.count({
         where: {
             userId: session.user.id,
             createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
         }
     });

     if (recentOrders >= 5) {
         return NextResponse.json({ error: "Rate limit exceeded. Please wait before creating another order." }, { status: 429 });
     }

     // Check for duplicate order using idempotency key
     const existingOrder = await prisma.order.findFirst({
         where: { idempotencyKey }
     });

     if (existingOrder) {
         return NextResponse.json({ error: "Duplicate order. Please use a different idempotency key." }, { status: 400 });
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

    //   // Validate inventory availability
    // for (const item of parsed.data.products) {
    //     const product = products.find((p) => p.id === item.productId)!;
    //     if (product.stock < item.quantity) {
    //         return NextResponse.json({ 
    //             error: `Insufficient stock for product ${item.productId}. Available: ${product.stock}, Requested: ${item.quantity}` 
    //         }, { status: 400 });
    //     }
    // }



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
                idempotencyKey,
                items: {
                    create: orderItemsData,
                },
            },
            include: {
                items: true,
            },
        });
          // Create the order with items and update inventory atomically
        // const order = await prisma.$transaction(async (tx) => {
        //     // Update product stock
        //     for (const item of parsed.data.products) {
        //         await tx.product.update({
        //             where: { id: item.productId },
        //             data: { stock: { decrement: item.quantity } }
        //         });
        //     }
    
        //     // Create the order
        //     return await tx.order.create({
        //         data: {
        //             userId: session.user.id,
        //             totalAmount,
        //             status: "PENDING",
        //             idempotencyKey,
        //             items: { create: orderItemsData },
        //         },
        //         include: { items: true },
        //     });
        // });


           // Get farmer email efficiently
          const farmer = await prisma.user.findFirst({ 
              where: { role: "FARMER", products: { some: { id: { in: productIds } } } }, 
              select: { email: true } 
          });

          if (farmer?.email) {
              try {
                  await sendEmailWithRetry({
                      from: "FarmFresh Marketplace <no-reply@yourdomain.com>",
                      to: farmer.email,
                      subject: "New Order Received",
                      html: `
                          <h2>New Order Placed</h2>
                          <p>Order ID: #${order.id}</p>
                          <p>Total: ₹${order.totalAmount}</p>
                      `,
                  });
              } catch (emailErr) {
                  console.error("Failed to send farmer notification email after retries:", emailErr);
                  // Don't block order creation if email fails
              }
          }


        // ✅ Send confirmation email via Resend
    try {
      await sendEmailWithRetry({
        from: "FarmFresh Marketplace <onboarding@resend.dev>", // change this
        to: session.user.email!, // send to logged-in customer's email
        subject: "Order Confirmation - Farm Fresh Marketplace",
        html: `
            <h2>Thank you for your order!</h2>
            <p>Your order <b>#${order.id}</b> has been placed successfully.</p>
            <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
            <p><b>Status:</b> ${order.status}</p>
            <h3>Items:</h3>
            <ul>
                ${order.items.map(i => `<li>${i.quantity} x ${i.productId} @ ₹${i.price}</li>`).join("")}
            </ul>
            `
        });
    } catch (emailErr) {
      console.error("Customer confirmation email sending failed after retries:", emailErr);
      // ⚠ Don't block order creation if email fails
    }

  
        
        return NextResponse.json(order, {status: 201});
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}