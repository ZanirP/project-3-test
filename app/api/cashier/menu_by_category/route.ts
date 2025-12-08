import { NextResponse } from "next/server";
import { fetch_menu_by_category } from "@/lib/db";

export async function POST(req: Request) {
    const { id } = await req.json();
    //console.log(`menu by cat ${id}`);
    const rows = await fetch_menu_by_category(id);
    return NextResponse.json(rows);
}
