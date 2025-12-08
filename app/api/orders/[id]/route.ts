import { NextRequest, NextResponse } from "next/server";
import { update_order_status } from "@/lib/db";
import type { OrderStatus } from "@/lib/models";

interface PatchBody {
    order_status?: OrderStatus;
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    const orderId = Number(id);

    if (Number.isNaN(orderId)) {
        return NextResponse.json(
            { error: "Invalid order id" },
            { status: 400 },
        );
    }

    let body: PatchBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 },
        );
    }

    const { order_status } = body;

    if (!order_status) {
        return NextResponse.json(
            { error: "order_status is required" },
            { status: 400 },
        );
    }

    try {
        console.log("PATCH /api/orders/", orderId, "→", order_status);

        const updated = await update_order_status(orderId, order_status);
        if (!updated) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (err) {
        console.error("Error updating order status:", err);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 },
        );
    }
}
