"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const {data: session, status} = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/api/auth/signin");
    }
  });

   if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mt-8">Home Page</h1>

      {session ? (
        <>
          <p className="mt-4">Signed in as {session.user?.email}</p>
          <button type="button" className="mt-4" onClick={() => signOut()}>Sign out</button>
        </>
      ) : (
        <>
          <p className="mt-4">Not signed in</p>
          <button type="button" className="mt-4" onClick={() => signIn()}>Sign in</button>
        </>
      )}
    </div>
  )
}
