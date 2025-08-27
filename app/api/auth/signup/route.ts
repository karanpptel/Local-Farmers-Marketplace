import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations/auth";



export async function POST(request: Request) {  
try {

    const body =  await request.json()

    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json( { error: "Validation error", issues: parsed.error.issues },{ status: 422 });
    }
    
        const { name, email, password, role } = parsed.data;
        //const { name, email, password, role } = await request.json();
    
        // // Validation
        // if (!email || !password) {
        //     return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        // }

        // if (!name) {
        //     return NextResponse.json({ error: "Name is required." }, { status: 400 });
        // }

        // // Validate password strength
        // if (password.length < 6) {
        //     return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
        // }

        // // Validate role
        // const validRoles = ["CUSTOMER", "FARMER", "ADMIN"];
        // if (role && !validRoles.includes(role)) {
        //     return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
        // }
    
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
    
        if (existingUser) {
            return NextResponse.json({ error: "User already exists." }, { status: 400 });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "CUSTOMER", // Default role to "CUSTOMER"
            },
        });
        
        return NextResponse.json({ 
            message: "User created successfully.", 
            user: { 
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            } 
        }, { status: 201 });
} catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}