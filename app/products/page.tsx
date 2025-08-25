// app/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: string;
  location: string;
  image?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      const query = new URLSearchParams({
        search,
        category,
        page: String(page),
      });

      const res = await fetch(`/api/products?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      setProducts(data.products ?? []);
      setTotalPages(data.totalPages ?? 1);
    };

    fetchProducts();
  }, [search, category, page]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Marketplace</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        <Select value={category} onValueChange={(v) => setCategory(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FRUITS">Fruits</SelectItem>
            <SelectItem value="VEGETABLES">Vegetables</SelectItem>
            <SelectItem value="GRAINS">Grains</SelectItem>
            <SelectItem value="DAIRY">Dairy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <p className="text-muted-foreground">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden shadow-md">
              {/* Product Image */}
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">
                    No image available
                  </span>
                )}
              </div>

              {/* Card Content */}
              <CardContent className="p-4 space-y-2">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {p.description || "No description"}
                </p>
                <p className="font-medium">₹{p.price}</p>
                <p className="text-xs text-muted-foreground">
                  {p.quantity} available • {p.category}
                </p>
                <p className="text-xs text-muted-foreground">{p.location}</p>
                <Button className="w-full mt-2">Order Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="self-center">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
