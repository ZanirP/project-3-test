import { NextResponse } from "next/server";
import { insert_into_orders_table } from "@/lib/db";

export async function POST(req: Request) {
    const json = (await req.json()) as {
        cost: number;
        employeeId: string;
        paymentMethod: string;
    };
    console.log(json);

    const rows = await insert_into_orders_table(
        json.cost,
        parseInt(json.employeeId),
        json.paymentMethod,
    );

    console.log("Successfully created order");

    return NextResponse.json(rows[0], { status: 201 });
}
