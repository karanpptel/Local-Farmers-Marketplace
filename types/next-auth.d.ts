import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session{
        user: {
            id?: string | null;
            role?: string;
        } & DefaultSession["user"];
    }
}

interface User extends DefaultUser {
    role?: string;
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        role?: string;
        
    }
}