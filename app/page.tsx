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

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/login", // Redirect to home page after sign out
    });
  };

  const handleSignIn = async () => {
    await signIn();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mt-8">Home Page</h1>

      {session ? (
        <>
          <p className="mt-4">Signed in as {session.user?.email}</p>
          <button type="button" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded transition" onClick={handleSignOut}>Sign out</button>
        </>
      ) : (
        <>
          <p className="mt-4">Not signed in</p>
          <button type="button" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded transition" onClick={handleSignIn}>Sign in</button>
        </>
      )}
    </div>
  )
}
