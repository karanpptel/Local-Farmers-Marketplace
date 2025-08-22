"use client";

import { signOut, useSession } from "next-auth/react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Dummy products (later you can fetch from DB/API)
const products = [
  {
    id: 1,
    name: "Fresh Tomatoes",
    price: 120,
    image: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    name: "Organic Potatoes",
    price: 80,
    image: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    name: "Milk (1L)",
    price: 60,
    image: "https://via.placeholder.com/150",
  },
  {
    id: 4,
    name: "Brown Eggs (12pcs)",
    price: 150,
    image: "https://via.placeholder.com/150",
  },
];

export default function CustomerDashboard() {
  const { data: session } = useSession();

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">Customer Dashboard</h1>
      <p className="mt-4">Logged in as: {session?.user?.email}</p>
      <p className="mt-2">Role: {session?.user?.role}</p>
      <button
        onClick={() => signOut()}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded"
      >
        Sign Out
      </button>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="shadow-md">
            <CardHeader>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover rounded-t"
              />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
              <p className="mt-2 text-gray-700">Price: ₹{product.price}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Add to Cart</Button>
            </CardFooter>
          </Card>
        ))}
    </div>
    </div>
  );
}
