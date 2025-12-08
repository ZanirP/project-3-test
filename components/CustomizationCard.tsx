"use client";

import React, { memo } from "react";

interface CustomizationCardProps {
    itemName: string;
    whenClicked?: (name: string) => void;
    isSelected: boolean; // current selection passed from parent
    isDisabled: boolean;
}

const CustomizationCard: React.FC<CustomizationCardProps> = memo(
    ({ itemName, whenClicked, isSelected, isDisabled = false }) => {
        if (isDisabled) {
            return (
                <div
                    className={`bg-[#42424286] text-[#ffffff9a] h-[120px] w-[120px] flex justify-center items-center shadow-lg p-2 text-center transform transition-transform duration-300 hover:scale-110 cursor-pointer rounded-md"
          `}
                >
                    <p className="whitespace-normal break-words text-xl font-medium">
                        {itemName}
                    </p>
                </div>
            );
        }
        return (
            <div
                onClick={() => whenClicked?.(itemName)}
                className={`h-[120px] w-[120px] flex justify-center items-center shadow-lg p-2 text-center transform transition-transform duration-300 hover:scale-110 cursor-pointer rounded-md
          ${isSelected ? "bg-green-800 text-white" : "bg-gray-200 text-black"}
        `}
            >
                <p className="whitespace-normal break-words text-xl font-medium">
                    {itemName}
                </p>
            </div>
        );
    },
);

export default CustomizationCard;
