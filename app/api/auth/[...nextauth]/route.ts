// console.log("--- DEBUGGING NEXTAUTH ---");
// console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
// console.log("NEXTAUTH_SECRET is set:", !!process.env.NEXTAUTH_SECRET);
// console.log("--------------------------");

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signInSchema } from "@/lib/validations/auth";

// Helper to check required env vars
function checkEnvVar(name: string) {
  if (!process.env[name]) {
    console.warn(`Warning: Environment variable ${name} is not set.`);
  }
}
[
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
].forEach(checkEnvVar);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing email or password in credentials.");
          return null;
        }

        // Validate credentials using Zod schema
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) {
          console.error("Invalid credentials format:", parsed.error.issues);
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          // Type safety: check user and password
          if (!user || typeof user.password !== "string") {
            console.error("User not found or password missing.");
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            console.error("Invalid password for user:", email);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "CUSTOMER",
          };
        } catch (error) {
          console.error("Error authenticating user:", error);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "CUSTOMER";
        token.email = user.email;

      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string || "CUSTOMER";
        session.user.email = token.email as string;

       // session.user.name = token.name as string 

      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Handle same-origin URLs
      if (new URL(url).origin === baseUrl) return url;
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // Error page URL
    newUser: "/signup", // New account creation page
  },
  secret: process.env.NEXTAUTH_SECRET,

  
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
