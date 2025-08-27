"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CustomerProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!data || data.error) return <p className="text-center mt-10">No profile data found.</p>;

  const { user, products, orders } = data;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Info */}
      <Card className="shadow-lg">
        <CardHeader className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name || "Unnamed Customer"}</CardTitle>
            <p className="text-sm text-gray-500">{user.email}</p>
            <Badge variant="outline" className="mt-2">
              {user.role}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Orders Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <p className="font-medium">Order #{order.id}</p>
                    <Badge
                      variant={
                        order.status === "PENDING"
                          ? "outline"
                          : order.status === "CANCELLED"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No orders found.</p>
          )}
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>My Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product: any) => (
                <div key={product.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    Price: ₹{product.price}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No products found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
