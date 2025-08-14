import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/auth";
import { redirect } from "next/navigation";


export default async function DashboardPage() {
    let session;

    try {
        session = await getServerSession(authOptions);
    } catch (error) {
        console.error("Error fetching session:", error);
        redirect("api/auth/signin");
    } 

    if (!session) {
        redirect("/api/auth/signin");
    }
       
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mt-8">Dashboard</h1>
            <p className="mt-4">Signed in as {session.user?.email}</p>
        </div>
    )
  
}