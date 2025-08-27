// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { loadStripe } from "@stripe/stripe-js";
// import { Button } from "@/components/ui/button";
// import { toast } from "react-toastify";

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// export default function CheckoutPage({ params }: { params: { orderId: string } }) {
//   const { orderId } = params;
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handlePayment = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/payments/create`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ orderId }),
//       });

//       if (!res.ok) throw new Error("Failed to create payment session");

//       const data = await res.json();

//       const stripe = await stripePromise;
//       if (!stripe) throw new Error("Stripe failed to load");

//       const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });

//       if (error) {
//         toast.error(error.message || "Payment failed");
//       }
//     } catch (err) {
//       console.error(err);
//       toast.error("Something went wrong during checkout");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Check Stripe redirect success URL
//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     if (urlParams.get("success")) {
//       toast.success("Payment successful! 🎉");
//       router.push("/customer/orders");
//     }
//     if (urlParams.get("canceled")) {
//       toast.error("Payment canceled");
//       router.push("/customer/cart");
//     }
//   }, [router]);

//   return (
//     <div className="flex flex-col items-center justify-center h-[70vh]">
//       <h1 className="text-2xl font-semibold mb-4">Checkout Order #{orderId}</h1>
//       <Button onClick={handlePayment} disabled={loading}>
//         {loading ? "Processing..." : "Pay Now"}
//       </Button>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      }
    );

    if (error) {
      alert(error.message);
    } else if (paymentIntent?.status === "succeeded") {
      console.log("✅ Payment succeeded:", paymentIntent);
      window.location.href = "/customer/orders";
    }

    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="p-3 border rounded-md bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#32325d",
                "::placeholder": { color: "#a0aec0" },
              },
              invalid: { color: "#e53e3e" },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

type CheckoutPageProps = {
  params: { orderId: string };
};

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderId } = params;
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientSecret = async () => {
      const response = await fetch(`/api/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        console.error("Failed to create payment intent");
        return;
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    };

    fetchClientSecret();
  }, [orderId]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
          <p className="text-gray-500">Complete your payment securely</p>
        </div>

        {/* Order summary */}
        <div className="mb-6 border-b pb-4">
          <p className="text-lg font-medium text-gray-700">
            Order #{orderId}
          </p>
          <p className="text-sm text-gray-500">
            Please enter your card details below to complete the purchase.
          </p>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm clientSecret={clientSecret} />
          </Elements>
        ) : (
          <p className="text-center text-gray-500">Loading payment details...</p>
        )}

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Powered by <span className="font-semibold">Stripe</span>
        </p>
      </div>
    </div>
  );
}
