"use client"

import { useEffect, useState } from "react"
import {loadStripe}  from "@stripe/stripe-js"
import {Elements, CardElement, useStripe, useElements} from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({clientSecret} : {clientSecret: string}) {

    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!stripe || !elements) {
            return;
        }

        setLoading(true);

        const {error, paymentIntent} = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement)!,
            },
        });

        
        if (error) {
            alert(error.message);
        } else if (paymentIntent?.status === "succeeded") {
            console.log("Payment succeeded:", paymentIntent);
            
        }

        setLoading(false);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <CardElement className="border p-2 rounded-md" />
            <button
                type="submit"
                disabled={!stripe || loading}
                className="bg-blue-500 text-white py-2 px-4 rounded-md"
            >
                {loading ? "Processing..." : "Pay"}
            </button>

        </form>
    );
   
}

type CheckoutPageProps = {
    params: Promise<{ orderId: string }>;
}


export async function CheckoutPage( { params }: CheckoutPageProps) {

    const [clientSecret, setClientSecret] = useState<string | null>(null);


    useEffect(() => {
        const fetchClientSecret = async () => {
            
            const response = await fetch(`/api/payments/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId: (await params).orderId }),
            });

            if (!response.ok) {
                console.error("Failed to create payment intent");
                return;
            }

            const data = await response.json();
            setClientSecret(data.clientSecret);
        };

        fetchClientSecret();
    }, [(await params).orderId]);



    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="w-96 p-6 shadow-lg rounded-lg bg-white space-y-4">
                <h1 className="text-2xl font-bold text-center">Checkout</h1>
                {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm clientSecret={clientSecret} />
                    </Elements>
                ) : (
                    <p>Loading payment details...</p>
                )}
            </div>
        </div>
    )
}