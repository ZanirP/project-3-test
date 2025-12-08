"use client";

import React, { memo } from "react";

interface ItemCardProps {
    itemName: string;
    key: number;
    whenClicked?: () => void; // optional callback prop
}

const ItemCard: React.FC<ItemCardProps> = memo(({ itemName, whenClicked }) => {
    return (
        <div
            onClick={whenClicked}
            className="h-[200px] w-[200px] bg-[#d0eef233] border-1 border-[#bfbfdfaa] flex justify-center items-center shadow-lg p-2 text-center transform transition-transform duration-300 hover:scale-110 cursor-pointer"
        >
            <p className="whitespace-normal break-words text-2xl">{itemName}</p>
        </div>
    );
});

export default ItemCard;
