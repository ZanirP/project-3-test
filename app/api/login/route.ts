import { NextResponse } from "next/server";
import { fetch_login_information } from "@/lib/db";

/**
 * POST request for login verification
 * @returns NextResponse indicating success or failure
 *  */
export async function POST(request: Request) {
    const { pin } = await request.json();

    // Validate pin: must exist, be a string, and match expected format (e.g., 4-8 digits)
    if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
        return NextResponse.json(
            { message: "Invalid or missing PIN format" },
            { status: 400 },
        );
    }
    const loginInfo = await fetch_login_information(pin);

    if (loginInfo.length === 0) {
        return NextResponse.json({ message: "Invalid PIN" }, { status: 401 });
    }

    return NextResponse.json(loginInfo[0]);
}
