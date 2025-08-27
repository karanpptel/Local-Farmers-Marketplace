import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { productCreateSchema } from "@/lib/validations/product";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
   
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || searchParams.get("search"))?.trim();
    const category = searchParams.get("category") as | "FRUITS" | "VEGETABLES" | "GRAINS" | "DAIRY" | null;

    try {

        const products = await prisma.product.findMany({
            where: {
                AND: [
                    q 
                        ? {
                            OR: [
                                { name: { contains: q, mode: "insensitive" } },
                                { description: { contains: q, mode: "insensitive" } },
                                { location: { contains: q, mode: "insensitive" } },
                            ],
                        }
                        : {},
                    category ? { category } : {},
                    { stock: { gt: 0 } },

    
                ],
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            products, 
            totalPages: 1
        });
        
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
 
}

export async function POST(req: Request) {

    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "FARMER") {
        return NextResponse.json({ error: "Only FARMER can create products" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json( { error: "Validation error", issues: parsed.error.issues },{ status: 422 });
    }

    const { name, description, category, stock, price, location , image } = parsed.data;

    try {
        const product = await prisma.product.create({
            data : {
                name,
                description : description || "",
                price, // Prisma accepts number for Decimal
                category,
                stock,
                quantity: stock,
                location,
                image: image || null,
                farmerId:  session.user.id, // your jwt() sets token.id => session.user.id
            },
        });

        return NextResponse.json(product);

    } catch (error) {
        console.error("POST /api/products error:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}