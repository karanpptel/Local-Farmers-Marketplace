import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

import {  productUpdateSchema } from "@/lib/validations/product";
import { authOptions } from "../../auth/[...nextauth]/route";



type paramsType = {
    params: Promise<{ id: string }> ;
}

export async function PUT(req: Request, { params }: paramsType) {
    const session = await getServerSession();

    if (!session || session.user?.role !== "FARMER") {
        return NextResponse.json({ error: "Only FARMER can update products" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const parsed =  productUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
        }

        //Ensure ownership
       const existing = await prisma.product.findUnique({
            where: { id: (await params).id },
        });

        if (!existing || existing.farmerId !== session.user.id) {
            return NextResponse.json({ error: "You can only update your own products" }, { status: 403 });
        }

        const updated = await prisma.product.update({
            where: { id: (await params).id },
            data: parsed.data,
            // Ensure the farmerId is set to the current user's id
            // This is optional if the farmerId is not being changed
            // farmerId: session.user.id, // Uncomment if you want to enforce this
        });

        return NextResponse.json({product : updated});
    } catch (error) {
        console.error(`PUT /api/products/${(await params).id} error:`, error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}


export async function DELETE(req:Request, {params} : paramsType) {

    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "FARMER") {
        return NextResponse.json({ error: "Only FARMER can delete products" }, { status: 403 });
    }

    try {
        //Ensure ownership
        const existing = await prisma.product.findUnique({
            where: { id: (await params).id },
        });

        if (!existing || existing.farmerId !== session.user.id) {
            return NextResponse.json({ error: "You can only delete your own products" }, { status: 403 });
        }

         await prisma.product.delete({
            where: { id: (await params).id },
        });

        return NextResponse.json({ message: "Product deleted successfully", ok: true});
    } catch (error) {
        console.error(`DELETE /api/products/${(await params).id} error:`, error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
         
    }
}