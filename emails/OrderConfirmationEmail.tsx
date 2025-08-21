// emails/OrderConfirmationEmail.tsx
import * as React from "react";
import { Html, Body, Container, Text, Hr } from "@react-email/components";

type Item = { name: string; quantity: number; price: string };
export function OrderConfirmationEmail(props: {
    customerName?: string | null;
  orderId: string;
  items: Item[];
  total: string;
}) {
  const { customerName , orderId, items, total } = props;

  return (
    <Html>
      <Body style={{ backgroundColor: "#f7fafc", fontFamily: "ui-sans-serif, system-ui" }}>
        <Container style={{ background: "#fff", padding: "24px", borderRadius: 12, maxWidth: 600, margin: "24px auto" }}>
          <Text style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Thanks for your order! ✅</Text>
          <Text style={{ marginTop: 4 }}>Hi {customerName ?? "there"}, we’ve received your order <b>#{orderId}</b>.</Text>
          <Hr />
          {items.map((it, i) => (
            <Text key={i} style={{ margin: "4px 0" }}>
              • {it.name} × {it.quantity} — {it.price}
            </Text>
          ))}
          <Hr />
          <Text style={{ fontWeight: 700 }}>Total: {total}</Text>
          <Text style={{ color: "#718096" }}>We’ll notify you when payment completes and your order ships.</Text>
        </Container>
      </Body>
    </Html>
  );
}
