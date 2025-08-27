"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type OrderItem = {
  product: {
    name: string;
    image?: string;
  };
  quantity: number;
  price: number; // use snapshot
};

type Order = {
  id: string;
  items: OrderItem[];
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/my");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      toast.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <p className="p-6 text-gray-600">Loading orders...</p>;

  if (orders.length === 0)
    return <p className="p-6 text-gray-600">No orders found.</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const total = order.items.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
          );

          return (
            <Card key={order.id} className="shadow-lg">
              <CardHeader>
                <CardTitle>
                  Order #{order.id.slice(-6)} - {order.status}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-500">
                  Placed on: {new Date(order.createdAt).toLocaleString()}
                </p>

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={`${item.product.name}-${item.quantity}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        {item.product.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-semibold">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            ₹{item.price} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-2">
                  <p className="font-semibold">Total: ₹{total}</p>
                  {order.status === "PENDING" && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `/api/orders/${order.id}/cancel`,
                            {
                              method: "POST",
                            }
                          );
                          if (!res.ok) throw new Error("Cancel failed");
                          toast.success("Order cancelled");
                          fetchOrders();
                        } catch {
                          toast.error("Failed to cancel order");
                        }
                      }}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
