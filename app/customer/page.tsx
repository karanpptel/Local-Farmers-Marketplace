"use client";

import { signOut, useSession } from "next-auth/react";

export default function CustomerDashboard() {
  const { data: session } = useSession();

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">Customer Dashboard</h1>
      <p className="mt-4">Logged in as: {session?.user?.email}</p>
      <button
        onClick={() => signOut()}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded"
      >
        Sign Out
      </button>
    </div>
  );
}
