import { NextResponse } from "next/server";
import {
    insert_into_ingredient_management_table,
    populate_ingredient_management_table,
    delete_from_ingredient_management_table,
    update_ingredient_management_table,
} from "@/lib/db";

/**
 * GET request to get all menu items from database.
 */
export async function GET() {
    const rows = await populate_ingredient_management_table();
    return NextResponse.json(rows);
}

/**
 * POST request to add a new item to the menu database.
 */
export async function POST(req: Request) {
    const b = await req.json();
    const { name, stock, cost, groupName } = b;

    // Run validation on inputted values
    if (!name || name.trim() === "" || typeof name !== "string") {
        return NextResponse.json(
            { error: "Name is required." },
            { status: 400 },
        );
    }

    if (
        !groupName ||
        groupName.trim() === "" ||
        typeof groupName !== "string"
    ) {
        return NextResponse.json(
            { error: "Group Name is required." },
            { status: 400 },
        );
    }

    const stockNum = Number(stock);
    const costNum = Number(cost);

    if (!Number.isFinite(stockNum) || stockNum < 0) {
        return NextResponse.json({ error: "Invalid stock." }, { status: 400 });
    }

    if (!Number.isFinite(costNum) || costNum < 0) {
        return NextResponse.json({ error: "Invalid cost." }, { status: 400 });
    }

    const rows = await insert_into_ingredient_management_table(
        name,
        stock,
        cost,
        groupName,
    );

    return NextResponse.json(rows[0], { status: 201 });
}

/**
 * DELETE request to delete an item from the database.
 * */
export async function DELETE(req: Request) {
    try {
        const b = await req.json();

        // check if request had a id passed in and then convert to a number.
        const id = b?.id;
        const idNum = Number(id);

        if (!Number.isFinite(idNum) || idNum < 0) {
            return NextResponse.json(
                { error: "ID not valid." },
                { status: 400 },
            );
        }

        const row = await delete_from_ingredient_management_table(idNum);
        return NextResponse.json(row, { status: 200 });
    } catch (e: any) {
        if (e.message?.includes("not found")) {
            return NextResponse.json({ error: e.message }, { status: 404 });
        }

        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

/**
 * PUT request to update an item from the database.
 */
export async function PUT(req: Request) {
    try {
        const b = await req.json();
        const { id, name, stock, cost, groupName } = b;

        const idNum = Number(id);

        // Run validation on inputted values
        if (!name || name.trim() === "" || typeof name !== "string") {
            return NextResponse.json(
                { error: "Name is required." },
                { status: 400 },
            );
        }

        if (
            !groupName ||
            groupName.trim() === "" ||
            typeof groupName !== "string"
        ) {
            return NextResponse.json(
                { error: "Group Name is required." },
                { status: 400 },
            );
        }

        const stockNum = Number(stock);
        const costNum = Number(cost);

        if (!Number.isFinite(stockNum) || stockNum < 0) {
            return NextResponse.json(
                { error: "Invalid stock." },
                { status: 400 },
            );
        }

        if (!Number.isFinite(costNum) || costNum < 0) {
            return NextResponse.json(
                { error: "Invalid cost." },
                { status: 400 },
            );
        }

        if (!Number.isFinite(idNum) || idNum < 0) {
            return NextResponse.json(
                { error: "ID not valid." },
                { status: 400 },
            );
        }

        const row = await update_ingredient_management_table(
            idNum,
            name,
            stockNum,
            costNum,
            groupName,
        );
        return NextResponse.json(row, { status: 200 });
    } catch (e: any) {
        if (e.message?.includes("not found")) {
            return NextResponse.json({ error: e.message }, { status: 404 });
        }

        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
