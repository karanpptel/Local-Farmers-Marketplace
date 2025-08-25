import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }


    try {
        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: true, // Include product details in the order items
                    },
                   
                },
                payments: true, // Include payment details
            },
            orderBy: { createdAt: "desc" }, // Order by creation date, most recent first
        });

        return NextResponse.json( {orders}, { status: 200 });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}