import { NextResponse } from "next/server";
import {
    insert_into_drinks_ingredients_table,
    update_ingredient_inventory,
} from "@/lib/db";

//idk why any of this has to be this way
export async function POST(req: Request) {
    const thing = await req.json();
    const { drink_id, ingredient_id, servings } = thing;
    const rows = await insert_into_drinks_ingredients_table(
        drink_id,
        ingredient_id,
        servings,
    );
    await update_ingredient_inventory(servings, ingredient_id);
    //console.log(rows[0]);
    //console.log("== check ==")
    return NextResponse.json(rows[0], { status: 201 });
}
