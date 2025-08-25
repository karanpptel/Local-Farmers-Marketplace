"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProductItem = {
  product: { name: string };
  quantity: number;
};

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  items: ProductItem[];
};

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

// Assign badge colors for each status
const statusVariant = (status: string) => {
  switch (status) {
    case "PENDING": return "secondary";
    case "CONFIRMED": return "primary";
    case "SHIPPED": return "warning";
    case "DELIVERED": return "success";
    case "CANCELLED": return "destructive";
    default: return "default";
  }
};

export default function FarmerOrders() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null);
  const [newStatus, setNewStatus] = React.useState<string>("");
  const [expandedOrderIds, setExpandedOrderIds] = React.useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = React.useState<string>("ALL");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/farmer/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders whenever filterStatus changes
  React.useEffect(() => {
    if (filterStatus === "ALL") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o) => o.status === filterStatus));
    }
  }, [filterStatus, orders]);

  const handleUpdateStatus = async () => {
    if (!editingOrder || newStatus === editingOrder.status) return; // Avoid redundant updates
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setEditingOrder(null);
    } catch (err: any) {
      alert(err.message || "Error updating status");
    }
  };

  const toggleExpand = (orderId: string) => {
    const newSet = new Set(expandedOrderIds);
    if (newSet.has(orderId)) newSet.delete(orderId);
    else newSet.add(orderId);
    setExpandedOrderIds(newSet);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Orders</h2>

      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <span className="font-medium">Filter by status:</span>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchOrders}>Retry</Button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow>
                    <TableCell>
                      <Button variant="link" onClick={() => toggleExpand(order.id)} className="underline">
                        {order.id}
                      </Button>
                    </TableCell>
                    <TableCell>{order.user.name}</TableCell>
                    <TableCell>₹{order.totalAmount}</TableCell>
                    <TableCell>
                      <Badge className={`${statusVariant(order.status)} text-white`}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingOrder(order);
                          setNewStatus(order.status);
                        }}
                      >
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expandable row */}
                  {expandedOrderIds.has(order.id) && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={6}>
                        <div className="space-y-2 p-2">
                          <h4 className="font-medium">Products in this Order:</h4>
                          <ul className="list-disc list-inside">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.product.name} - Quantity: {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Status Modal */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              {STATUS_OPTIONS.filter((s) => s !== "ALL").map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </Select>
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={handleUpdateStatus} disabled={newStatus === editingOrder?.status}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => setEditingOrder(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
