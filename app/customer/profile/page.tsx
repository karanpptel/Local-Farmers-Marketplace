"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Customer = {
  name: string;
  email: string;
  phone?: string;
};

export default function ProfilePage() {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/customers/me");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setCustomer(data.customer);
    } catch (err) {
      toast.error("Error fetching profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/customers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-600">Loading profile...</p>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={customer.name}
              onChange={(e) =>
                setCustomer((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              value={customer.email}
              onChange={(e) =>
                setCustomer((prev) => ({ ...prev, email: e.target.value }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={customer.phone || ""}
              onChange={(e) =>
                setCustomer((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="mt-1"
            />
          </div>

          <Button onClick={handleUpdate} disabled={updating} className="w-full">
            {updating ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
