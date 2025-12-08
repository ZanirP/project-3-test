import { NextResponse } from "next/server";
import { usageBetweenDates } from "@/lib/db";

/**
 * returns the inventory usage data from two dates.
 */
export async function POST(req: Request) {
    try {
        const b = await req.json();

        const { startDate, endDate } = b;

        // Run validation on inputted values
        if (
            !startDate ||
            startDate.trim() == "" ||
            typeof startDate != "string"
        ) {
            return NextResponse.json(
                { error: "start date is empty. " },
                { status: 400 },
            );
        }

        if (!endDate || endDate.trim() == "" || typeof endDate != "string") {
            return NextResponse.json(
                { error: "end date is empty. " },
                { status: 400 },
            );
        }

        const rows = await usageBetweenDates(startDate, endDate);

        return NextResponse.json(rows);
    } catch (err) {
        console.error("Error in /api/reports/usage:", err);
        return NextResponse.json(
            { error: "Failed to fetch inventory usage report." },
            { status: 500 },
        );
    }
}
