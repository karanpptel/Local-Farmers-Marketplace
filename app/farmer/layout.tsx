"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FarmerLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/farmer" },
    { name: "Products", href: "/farmer/products" },
    { name: "Orders", href: "/farmer/orders" },
    { name: "Profile", href: "/farmer/profile" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo / Title */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">🌾 Farmer Panel</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ name, href }) => (
            <Link key={name} href={href}>
              <Button
                variant={pathname === href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-left font-medium",
                  pathname === href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {name}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Footer: User Info + Sign Out */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>
                {session?.user?.name?.[0] || "F"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
