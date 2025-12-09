"use client";

import React, { memo } from "react";

interface ItemCardProps {
    itemName: string;
    whenClicked?: () => void; // optional callback prop
    isDisabled?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = memo(
    ({ itemName, whenClicked, isDisabled = false }) => {
        const handleClick = () => {
            if (isDisabled) return; // do nothing if disabled
            whenClicked?.();
        };

        return (
            <div
                onClick={handleClick}
                className={[
                    "h-[200px] w-[200px] border-1 flex justify-center items-center shadow-lg p-2 text-center transform transition-transform duration-300",
                    // base bg + border
                    "bg-[#d0eef233] border-[#bfbfdfaa]",
                    // disabled vs normal state
                    isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:scale-110 cursor-pointer",
                ].join(" ")}
            >
                <p className="whitespace-normal break-words text-2xl">
                    {itemName}
                </p>
            </div>
        );
    },
);

export default ItemCard;
