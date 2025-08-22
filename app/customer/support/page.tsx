"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function CustomerSupportPage() {
  const [ticket, setTicket] = useState({
    subject: "",
    message: "",
  });

  const [tickets, setTickets] = useState<
    { id: number; subject: string; status: "open" | "resolved" }[]
  >([
    { id: 1, subject: "Payment issue", status: "open" },
    { id: 2, subject: "Profile update not saving", status: "resolved" },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTicket({ ...ticket, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!ticket.subject || !ticket.message) return;
    const newTicket = {
      id: tickets.length + 1,
      subject: ticket.subject,
      status: "open" as const,
    };
    setTickets([newTicket, ...tickets]);
    setTicket({ subject: "", message: "" });
    // TODO: Call API to save support ticket
    console.log("Ticket submitted:", newTicket);
  };

  return (
    <div className="p-6 flex flex-col md:flex-row gap-6">
      {/* Left side: Create new support ticket */}
      <Card className="w-full md:w-1/2 shadow-lg">
        <CardHeader>
          <CardTitle>Raise a Support Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Enter ticket subject"
              value={ticket.subject}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Describe your issue"
              value={ticket.message}
              onChange={handleChange}
            />
          </div>
          <Button onClick={handleSubmit}>Submit Ticket</Button>
        </CardContent>
      </Card>

      {/* Right side: Ticket history */}
      <Card className="w-full md:w-1/2 shadow-lg">
        <CardHeader>
          <CardTitle>My Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-sm">No tickets raised yet.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center border rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{t.subject}</p>
                  <p className="text-xs text-gray-500">Ticket ID: #{t.id}</p>
                </div>
                <Badge
                  variant={t.status === "open" ? "default" : "secondary"}
                >
                  {t.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
