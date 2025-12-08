import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import path from "path";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public routes and login page
    if (
        pathname === "/loginPage" ||
        pathname === "/" ||
        pathname.startsWith("/api/auth") ||
		pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname == "/customerOrderPage" ||
        pathname == "/HomePage"
    ) {
        return NextResponse.next();
    }

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    console.log("MIDDLEWARE TOKEN:", token);
    console.log("MIDDLEWARE PATH:", pathname);

    // Not logged in → redirect to login
    if (!token) {
        return NextResponse.redirect(new URL("/loginPage", req.url));
    }

    const role = token.role;

    const managerPages = [
        "/managerPage",
        "/employees",
        "/ingredientManagementPage",
        "/menuManagementPage",
        "/x_and_z_reports",
        "/KitchenPage",
    ];

    // manager-only routes
    if (managerPages.some((page) => pathname.startsWith(page))) {
        if (role !== "manager") {
            return NextResponse.redirect(new URL("/CashierPage", req.url));
        }
    }

    // cashier routes
    if (pathname.startsWith("/CashierPage")) {
        if (role !== "cashier" && role !== "manager") {
            return NextResponse.redirect(new URL("/loginPage", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/managerPage/:path*",
        "/employees/:path*",
        "/ingredientManagementPage/:path*",
        "/menuManagementPage/:path*",
        "/x_and_z_reports/:path*",
        "/CashierPage/:path*",
    ],
};
