import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "FARMER") {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch products created by the farmer
    
   try {
     const products = await prisma.product.findMany({
         where: { farmerId: session.user.id },
         orderBy: { createdAt: "desc" },
     });
     return NextResponse.json({ products });
   } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
   }
}