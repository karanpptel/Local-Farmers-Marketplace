import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

//get order by ID

export type paramsType = {
    params:  { id: string }
}
export async function GET(req: Request, { params }: paramsType) {

    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {

        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const order = await prisma.order.findUnique({
            where: {id: params.id },
            include: {
                items: {
                    include: {
                        product: true, // Include product details in the order items
                    },
                },
                payments: true, // Include payment details
            },
        });

        if (!order || order.userId !== session.user.id) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({order}, { status: 200 });
    } catch (error) {
        console.error("Get Order by ID error:", error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}