export { default } from "next-auth/middleware";

// Protect specific routes
export const config = {
  matcher: [
     "/dashboard/:path*", // Protect dashboard
    "/profile/:path*",   // Protect profile 
  ],
};
