"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string | null;
  category: "FRUITS" | "VEGETABLES" | "GRAINS" | "DAIRY";
  location: string;
};

export default function CustomerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const router = useRouter();

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

       // console.log('data:', data);

        setProducts(data.products);
        setFilteredProducts(data.products);

      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
    fetchProducts();
  }, []);

  // Apply search + filter
  useEffect(() => {
    let filtered = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filterCategory && filterCategory !== "ALL") {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }

     console.log('products:', products);
console.log('search:', search);
console.log('filterCategory:', filterCategory);

    setFilteredProducts(filtered);
  }, [search, filterCategory, products]);

  // Place order immediately
  async function handleOrderNow(productId: string) {
    try {
      const idempotencyKey = uuidv4();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          products: [{ productId, quantity: 1 }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to place order");
      }

      toast.success("✅ Order placed successfully!");
      router.push("/customer/orders");
    } catch (err: any) {
      toast.error(err.message || "❌ Error placing order");
    }
  }

  // Add product to cart
  async function handleAddToCart(productId: string) {
    try {
      const res = await fetch("/api/orders/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add to cart");
      }

      toast.success("🛒 Added to cart!");
    } catch (err: any) {
      toast.error(err.message || "❌ Error adding to cart");
    }
  }

  console.log('filteredProducts:', filteredProducts);
  return (
    <div className="p-6 space-y-6">
      {/* Search & Filter */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search product by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />
        <Select
          onValueChange={(val) => setFilterCategory(val)}
          defaultValue="ALL"
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="FRUITS">Fruits</SelectItem>
            <SelectItem value="VEGETABLES">Vegetables</SelectItem>
            <SelectItem value="GRAINS">Grains</SelectItem>
            <SelectItem value="DAIRY">Dairy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="shadow-lg">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={300}
                  height={200}
                  className="rounded-md object-cover w-full h-48"
                />
              ) : (
                <div className="bg-gray-200 w-full h-48 flex items-center justify-center rounded-md">
                  No Image
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">{product.description}</p>
              <p className="font-semibold mt-2">₹{product.price}</p>

              <div className="flex gap-2 mt-4">
                <Button onClick={() => handleOrderNow(product.id)}>
                  Order Now
                </Button>
                <Button variant="outline" onClick={() => handleAddToCart(product.id)}>
                  Add to Cart
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary">View Details</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{product.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={500}
                          height={300}
                          className="rounded-md object-cover w-full h-64"
                        />
                      ) : (
                        <div className="bg-gray-200 w-full h-64 flex items-center justify-center rounded-md">
                          No Image
                        </div>
                      )}
                      <p>{product.description}</p>
                      <p className="font-semibold">Price: ₹{product.price}</p>
                      <p className="text-sm text-gray-600">
                        Category: {product.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        Location: {product.location}
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => handleOrderNow(product.id)}
                      >
                        Order Now
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleAddToCart(product.id)}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
