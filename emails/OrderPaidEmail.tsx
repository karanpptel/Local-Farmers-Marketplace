// emails/OrderPaidEmail.tsx
import * as React from "react";
import { Html, Body, Container, Text, Hr } from "@react-email/components";

export function OrderPaidEmail(props: {
  customerName?: string | null;
  orderId: string;
  total: string;
}) {
  const { customerName, orderId, total } = props;
  return (
    <Html>
      <Body style={{ backgroundColor: "#f7fafc", fontFamily: "ui-sans-serif, system-ui" }}>
        <Container style={{ background: "#fff", padding: "24px", borderRadius: 12, maxWidth: 600, margin: "24px auto" }}>
          <Text style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Payment Successful 💳</Text>
          <Text style={{ marginTop: 4 }}>
            Hi {customerName ?? "there"}, your payment for order <b>#{orderId}</b> was successful.
          </Text>
          <Hr />
          <Text style={{ fontWeight: 700 }}>Total paid: {total}</Text>
          <Text style={{ color: "#718096" }}>We’ll send updates as your order moves to shipping.</Text>
        </Container>
      </Body>
    </Html>
  );
}
