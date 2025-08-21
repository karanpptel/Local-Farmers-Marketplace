// emails/NewOrderForFarmerEmail.tsx
import * as React from "react";
import { Html, Body, Container, Text, Hr } from "@react-email/components";

type Item = { name: string; quantity: number };
export function NewOrderForFarmerEmail(props: {
  farmerName?: string | null;
  orderId: string;
  items: Item[];
}) {
  const { farmerName, orderId, items } = props;
  return (
    <Html>
      <Body style={{ backgroundColor: "#f7fafc", fontFamily: "ui-sans-serif, system-ui" }}>
        <Container style={{ background: "#fff", padding: "24px", borderRadius: 12, maxWidth: 600, margin: "24px auto" }}>
          <Text style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>New Order Received 🛒</Text>
          <Text style={{ marginTop: 4 }}>
            Hello {farmerName ?? "Farmer"}, you have a new order <b>#{orderId}</b>.
          </Text>
          <Hr />
          {items.map((it, i) => (
            <Text key={i} style={{ margin: "4px 0" }}>
              • {it.name} × {it.quantity}
            </Text>
          ))}
          <Text style={{ color: "#718096" }}>Please prepare the items. View details in your dashboard.</Text>
        </Container>
      </Body>
    </Html>
  );
}
