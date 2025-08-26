import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
// this api route is used show all orders on farmers
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "FARMER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Fetch orders that include at least one product belonging to this farmer
        const orders = await prisma.order.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            farmerId: session.user.id, // Assuming 'farmerId' field exists in Product
                        },
                    },
                },
            },
            include: {
                items: {
                    include: {
                        product: true, // Include product details
                    },
                },
                user: { select: { name: true, email: true } }, // Customer info
                payments: true, // Payment details
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        console.error("Error fetching farmer orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
