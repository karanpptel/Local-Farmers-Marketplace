"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type CartItem = {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart items
  const fetchCart = async () => {
    try {
      const res = await fetch("/api/orders/cart");
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCartItems(data.items || []);
    } catch (err) {
      toast.error("Error fetching cart");
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const res = await fetch(`/api/orders/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      fetchCart();
      toast.success("Cart updated");
    } catch {
      toast.error("Error updating cart");
    }
  };

  // Remove item
  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/orders/cart/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove item");
      fetchCart();
      toast.success("Item removed");
    } catch {
      toast.error("Error removing item");
    }
  };

  // Checkout
  const checkout = async () => {
    if (cartItems.length === 0) {
      toast.info("Your cart is empty");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to place order");
      const data = await res.json();

      // ✅ Redirect to /checkout/[orderId]
      if (data?.id) {
        window.location.href = `/checkout/${data.id}`;
      } else {
        toast.error("Order created but no ID returned");
      }
    } catch (err) {
      console.error(err);
      toast.error("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cartItems.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {item.product.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <h2 className="font-semibold">{item.product.name}</h2>
                      <p className="text-sm text-gray-600">
                        ₹{item.product.price} x {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-lg font-semibold">Subtotal: ₹{subtotal}</p>
            <Button onClick={checkout} disabled={loading}>
              {loading ? "Processing..." : "Checkout"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
