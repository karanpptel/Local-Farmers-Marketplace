import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";


export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error : "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ message: "You have access to this protected API!" });
}