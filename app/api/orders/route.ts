import { NextRequest, NextResponse } from "next/server";
import { fetch_kitchen_orders_by_status, createOrder } from "@/lib/db";
import type { OrderStatus } from "@/lib/models";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get(
            "order_status",
        ) as OrderStatus | null;

        const orderStatus: OrderStatus = statusParam ?? "not_working_on";

        const orders = await fetch_kitchen_orders_by_status(orderStatus);
        return NextResponse.json(orders, { status: 200 });
    } catch (err) {
        console.error("Error fetching kitchen orders:", err);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 },
        );
    }
}
