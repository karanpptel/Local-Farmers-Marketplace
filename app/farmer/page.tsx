"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  quantity: number;
  category: "FRUITS" | "VEGETABLES" | "GRAINS" | "DAIRY";
  location: string;
  image?: string | null;
  createdAt?: string;
};

export default function FarmerDashboard() {
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/products/my", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        if (active) setProducts(data.products ?? []);
      } catch (e: any) {
        if (active) setError(e.message || "Something went wrong");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Derived stats
  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const lowStock = products.filter((p) => p.quantity <= 5).length;

  // Local search (name/description/location)
  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  const recent = filtered.slice(0, 5);

  const formatCurrency = (v: number | string) => {
    const num = typeof v === "string" ? parseFloat(v) : v;
    if (Number.isNaN(num)) return "-";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  };

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this product permanently?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Delete failed");
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e.message || "Could not delete the product");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header + CTAs */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Farmer Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Quick overview and shortcuts to manage your products.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/farmer/products/new">
            <Button>+ Add product</Button>
          </Link>
          <Link href="/farmer/products">
            <Button variant="outline">Manage all</Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "—" : totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items you currently have listed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "—" : totalQuantity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sum of all product quantities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "—" : lowStock}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Products with ≤ 5 quantity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Recent table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search by name, description, or location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-md"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setQuery("")}>
                Clear
              </Button>
              <Button variant="secondary" onClick={() => router.push("/farmer/products")}>
                Go to products
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">Error: {error}</p>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : recent.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No products found. Try adjusting your search or{" "}
              <Link href="/farmer/products/new" className="underline underline-offset-4">
                add a new one
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="min-w-[160px]">Location</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.category}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(p.price)}</TableCell>
                      <TableCell>{p.quantity}</TableCell>
                      <TableCell className="truncate">{p.location}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/farmer/products/${p.id}/edit`}>
                            <Button size="sm" variant="outline">Edit</Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(p.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
