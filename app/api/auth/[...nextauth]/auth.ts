import { PrismaAdapter } from "@next-auth/prisma-adapter";
import  NextAuth, { NextAuthOptions} from "next-auth";
import  CredentialsProvider  from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";


// Helper to check required env vars
function checkEnvVar(name: string) {
  if (!process.env[name]) {
    console.warn(`Warning: Environment variable ${name} is not set.`);
  }
}
["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_SECRET"].forEach(checkEnvVar);


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
          if(!credentials?.email || !credentials?.password) {
              console.error("Missing email or password in credentials.");
              return null;
          }

          try {
            const user = await prisma.user.findUnique({
              where: { email : credentials.email }
            })
  
             // Type safety: check user and password
            if (!user || typeof user.password !== "string") {
              console.error("User not found or password missing.");
              return null;
            }
  
            const isValid = await bcrypt.compare(credentials.password, user.password);
            if (!isValid) {
              console.error("Invalid password for user:", credentials.email);
              return null;
            }
            return user
          } catch (error) {
            console.error("Error authenticating user:", error);
            return null;
          }
      }

    }),
  ],


  session : {strategy: "jwt"},

  callbacks: {
    async jwt({token, user}) {
      if(user) {
        token.id = user.id;

        // Type safety: add role if available, default to "CUSTOMER"
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },

    async session({ session, token}) {
      if (session.user) {
        // Default role to "CUSTOMER" if undefined
        session.user.role = (token.role as string) ?? "CUSTOMER";
      }
        return session;
    }
  },

  secret : process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

