import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Required so we can read raw body (needed for signature verification)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export  async function POST(req: Request) {
    const sig = req.headers.get("Stripe-Signature");
    const rawBody = await req.text();

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig! ,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
        } catch (err: any) {
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

    try{
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const orderId = paymentIntent.metadata?.orderId;

                 // Update payment + order
                    await prisma.payment.update({
                        where: { id: paymentIntent.id },
                        data: { status: "SUCCEEDED" },
                    });

                    if (orderId) {
                        await prisma.order.update({
                            where: { id: orderId },
                            data: { status: "CONFIRMED" },
                        });
                    }

                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await prisma.payment.update({
                    where: { id: paymentIntent.id },
                    data: { status: "FAILED" },
                });
                break;
            }

            case "charge.refunded": {
                // Optional: keep Payment row in sync for refunds
                const charge = event.data.object as Stripe.Charge;
               if(charge.payment_intent) {
                await prisma.payment.update({
                    where: { id: String(charge.payment_intent) },
                    data: { status: "REFUNDED" },
                });
               }
                break;
            }


            default: {
                console.log(`Unhandled event type: ${event.type}`);
                break;
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
                    
    } catch (error) {
        console.error("Error parsing Stripe webhook OR Webhook handling error:", error);
        return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
    }
}