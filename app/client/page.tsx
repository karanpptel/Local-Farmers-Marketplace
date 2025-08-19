"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClientPage() {
    const router = useRouter();
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            // Redirect to sign-in page if not authenticated
            router.push("/login");
        }
    });


    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mt-8">Client Page</h1>

            {session ? (
                <>
                    <p className="mt-4">Signed in as {session.user?.email}</p>
                    <button type="button" className="mt-4 px-4 py-2 bg-red-500 text-white rounded transition" onClick={() => signOut()}>Sign out</button>
                </>
            ) : (
                <>
                    <p className="mt-4">Not signed in</p>
                    <button type="button" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded transition" onClick={() => signIn()}>Sign in</button>
                </>
            )}
        </div>
    );
}