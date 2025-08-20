import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";
import { NextRequest } from "next/server";

// --- 1. Define Route Matchers (inspired by the Clerk example) ---
const isPublicRoute = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
};

//const isAdminRoute = (req: NextRequest) => req.nextUrl.pathname.startsWith("/admin");
const isFarmerRoute = (req: NextRequest) => req.nextUrl.pathname.startsWith("/farmer");
const isCustomerRoute = (req: NextRequest) => req.nextUrl.pathname.startsWith("/customer");
const isDashboardRoute = (req: NextRequest) => req.nextUrl.pathname === "/dashboard";


// --- 2. Export the main middleware using withAuth ---
export default withAuth(
  // The main middleware function that runs ONLY when `authorized` returns true.
  function middleware(req) {
    const token = req.nextauth.token;
    
    // --- 3. Redirect logged-in users away from public routes ---
    if (isPublicRoute(req)) {
      if (token) {
        // If a logged-in user tries to access login/signup, redirect them to the dashboard.
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      // If not logged in and on a public route, allow access.
      return NextResponse.next();
    }
    
    // At this point, we know the user is authenticated and not on a public route.
    const role = token!.role;

    // --- 4. Handle /dashboard auto-redirect based on role ---
    if (isDashboardRoute(req)) {
      // if (role === "ADMIN") {
      //   return NextResponse.redirect(new URL("/admin", req.url));
      // }
      if (role === "FARMER") {
        return NextResponse.redirect(new URL("/farmer", req.url));
      }
      // CUSTOMER role can stay on /customer, or you can have a default dashboard.
      // Assuming customer dashboard is at /customer
      return NextResponse.redirect(new URL("/customer", req.url));
    }

    // --- 5. Protect role-based routes ---
    // if (isAdminRoute(req) && role !== "ADMIN") {
    //   return NextResponse.redirect(new URL("/customer", req.url)); // Or a "/unauthorized" page
    // }
    if (isFarmerRoute(req) && role !== "FARMER") {
      return NextResponse.redirect(new URL("/customer", req.url));
    }
    // This check is slightly redundant if you only have three roles, but good practice.
    if (isCustomerRoute(req) && role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If no specific rules match, allow the request to proceed.
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback determines if the `middleware` function above should run.
      authorized: ({ req, token }) => {
        // --- 6. The core logic to prevent redirect loops ---
        // A request is authorized if:
        // 1. The user is logged in (a token exists).
        // 2. The user is trying to access a public route (even without a token).
        if (token || isPublicRoute(req)) {
          return true;
        }
        
        // Otherwise, the user is not authorized, and withAuth will redirect them to the login page.
        return false;
      },
    },
  }
);


// --- 7. Use a clean and effective matcher ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};