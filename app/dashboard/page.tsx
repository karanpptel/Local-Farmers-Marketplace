"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

     useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    } else {
      const role = session.user.role;

      if (role === "CUSTOMER") router.push("/customer");
      else if (role === "FARMER") router.push("/farmer");
      else if (role === "ADMIN") router.push("/admin");
      else router.push("/login"); // Fallback if role is not recognized
    }
  }, [status, session, router]);

  return <p className="text-center mt-20">Loading dashboard...</p>;
}