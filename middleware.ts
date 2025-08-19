
import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

export default withAuth (
  function middleware(req) {  

    const {pathname} = req.nextUrl;
    const token = req.nextauth.token;

    //No Token redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role;

    // Handle /dashboard auto-redirect
    if (pathname === "/dashboard") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (role === "FARMER") {
        return NextResponse.redirect(new URL("/farmer", req.url));
      }
      if (role === "CUSTOMER") {
        return NextResponse.redirect(new URL("/customer", req.url));
      }
    }

    // protects role based routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/customer", req.url));
    }

    if (pathname.startsWith("/farmer") && role !== "FARMER") {
      return NextResponse.redirect(new URL("/customer", req.url));
    }

    if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Only allow if logged in 
    }
  }

);

// Protect specific routes
export const config = {
  matcher: [
    "/admin/:path*",
    "/farmer/:path*",
    "/customer/:path*"
  ],
};
