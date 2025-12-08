import { NextResponse } from "next/server";
import { lowStockIngredients } from "@/lib/db";

/**
 *
 * @returns rows that are of low ingredient stock
 */
export async function GET() {
    try {
        const rows = await lowStockIngredients();
        return NextResponse.json(rows);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to fetch restock report." },
            { status: 500 },
        );
    }
}
