"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Order = {
  id: number;
  date: string;
  items: string[];
  total: number;
  status: "Delivered" | "Pending" | "Shipped" | "Cancelled";
};

export default function OrdersPage() {
  const [orders] = useState<Order[]>([
    {
      id: 101,
      date: "2025-08-18",
      items: ["Fresh Tomatoes", "Milk (1L)"],
      total: 300,
      status: "Delivered",
    },
    {
      id: 102,
      date: "2025-08-19",
      items: ["Organic Apples"],
      total: 250,
      status: "Pending",
    },
  ]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Delivered":
        return "bg-green-500 text-white";
      case "Pending":
        return "bg-yellow-500 text-white";
      case "Shipped":
        return "bg-blue-500 text-white";
      case "Cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>{order.items.join(", ")}</TableCell>
              <TableCell>₹{order.total}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
