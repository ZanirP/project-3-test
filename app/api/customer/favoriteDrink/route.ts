import { NextResponse } from "next/server";
import { getFavoriteDrinkForUser } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    const userId = userIdParam ? Number(userIdParam) : null;
    if (!userId || Number.isNaN(userId)) {
        return NextResponse.json(null);
    }

    const favoriteMenuId = await getFavoriteDrinkForUser(userId);

    if (favoriteMenuId == null) {
        return NextResponse.json(null);
    }

    return NextResponse.json({ favoriteMenuId });
}
