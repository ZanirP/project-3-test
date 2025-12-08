"use client";

import {
    ReactNode,
    useState,
    JSX,
    useMemo,
    useEffect,
    useCallback,
} from "react";
import Image from "next/image";
import IdleLogout from "@/components/idleLogout";
import TopNav from "@/components/TopNav";
import ItemCard from "../../components/ItemCard";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CustomizationCard from "@/components/CustomizationCard";
import { CupSoda, Minus, Plus, ReceiptTurkishLiraIcon } from "lucide-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import GoogleTranslate from "@/components/GoogleTranslate";
import LogoutButton from "@/components/LogoutButton";
import { MenuItem, Category, Ingredient } from "@/lib/models";
import { useSession, SessionProvider } from "next-auth/react";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface CartItem {
    id: number;
    ice: number;
    name: string;
    cost: number;
    scalars: {
        item: {
            name: string;
            id: number;
        };
        amount: number;
    }[];
    customizations: {
        id: number;
        name: string;
        cost: number;
        amount: number;
    }[];
}

type DrinkSize = "small" | "medium" | "large";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "ar", label: "العربية" },
];

type CurrencyCode = "USD" | "EUR" | "CAD" | "GBP";

const CURRENCIES = [
    { code: "USD", label: "USD - $", symbol: "$" },
    { code: "EUR", label: "EUR - €", symbol: "€" },
    { code: "CAD", label: "CAD - $", symbol: "$" },
    { code: "GBP", label: "GBP - £", symbol: "£" },
];

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    CAD: "$",
    GBP: "£",
};

const LABEL_KEYS = [
    "kioskTitle",
    "categories",
    "drinks",
    "cart",
    "subtotal",
    "tax",
    "total",
    "checkout",
    "confirmOrder",
    "yesPlaceOrder",
    "language",
    "addToOrder",
] as const;

type LabelKey = (typeof LABEL_KEYS)[number];
type Labels = Record<LabelKey, string>;

const EN_LABELS: Labels = {
    kioskTitle: "Self-Service Kiosk",
    categories: "Categories",
    drinks: "Drinks",
    cart: "Cart",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    checkout: "Checkout",
    confirmOrder: "Confirm Order?",
    yesPlaceOrder: "Yes, Place Order",
    language: "Language:",
    addToOrder: "Add to Order",
};

interface MenuData {
    [categoryName: string]: MenuItem[];
}

const emptyMenuData: MenuData = {};
const emptyInventory: Ingredient[] = [];

let inventory: Ingredient[] = [];
let globalToppingsGroups: Map<string, Ingredient[]> = new Map<
    string,
    Ingredient[]
>();
let scaleItems: { name: string; id: number }[] = [];

const TAX_RATE = parseFloat(process.env.NEXT_PUBLIC_TAX_RATE ?? "0.0825");
const LOYALTY_POINTS_THRESHOLD = 50;

function getCartItemSize(item: CartItem): DrinkSize {
    if (item.customizations.some((c) => c.id === 23)) return "small";
    if (item.customizations.some((c) => c.id === 24)) return "medium";
    if (item.customizations.some((c) => c.id === 22)) return "large";

    return "small";
}

const findInventoryCost = (name: string) => {
    const item = inventory.find(
        (it) => it.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    return item ? item.cost : 0;
};

function calculateSubtotal(cartItems: CartItem[]): number {
    let total = 0;

    for (const item of cartItems) {
        for (const customization of item.customizations)
            total += customization.cost;
        total += item.cost;
    }

    return total;
}

interface CategoryCardProps {
    category: string;
    label: string;
    isSelected: boolean;
    onClick: () => void;
}

function CategoryCard({
    category,
    label,
    isSelected,
    onClick,
}: CategoryCardProps) {
    const { isHighContrast } = useAccessibility();

    const base = "border p-4 rounded cursor-pointer";

    const normal = `hover:border-black transition duration-300 ${
        isSelected ? "bg-black text-white" : ""
    }`;

    const highContrast = `bg-black ${
        isSelected ? "text-blue-400" : "text-white"
    } border-2 border-white`;

    return (
        <div
            className={`${base} ${isHighContrast ? highContrast : normal}`}
            onClick={onClick}
        >
            <p>{label}</p>
        </div>
    );
}

interface CategorySelectorProps {
    categories: string[];
    selectedCategory: string;
    onSelectedCategoryChange: (category: string) => void;
    title: string;
    categoryLabels: Record<string, string>;
}

function CategorySelector({
    categories,
    selectedCategory,
    onSelectedCategoryChange,
    title,
    categoryLabels,
}: CategorySelectorProps) {
    const {
        isHighContrast,
        setIsHighContrast,
        textMultipler,
        setTextMultipler,
    } = useAccessibility();
    return (
        <div
            className={`w-fit space-y-4 flex-col items-center ${
                isHighContrast ? "text-white" : "text-black"
            } ${textMultipler >= 1.75 ? "max-w-50" : ""}`}
        >
            <Button
                variant="default"
                className="w-full"
                onClick={() => {
                    let t = isHighContrast;
                    setIsHighContrast(!t);
                }}
            >
                Toggle High Contrast
            </Button>
            <p className="text-center">Zoom</p>
            <div className="flex space-x-4">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                        if (textMultipler <= 1) return;
                        let z = textMultipler - 0.25;
                        document.documentElement.style.fontSize = `${16 * z}px`;
                        setTextMultipler(z);
                    }}
                >
                    <Minus color={`${isHighContrast ? "blue" : "black"}`} />
                </Button>
                <Input
                    type="number"
                    className="rounded-full w-fit"
                    value={textMultipler}
                    readOnly
                />
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                        if (textMultipler >= 2) return;
                        let z = textMultipler + 0.25;
                        document.documentElement.style.fontSize = `${16 * z}px`;
                        setTextMultipler(z);
                    }}
                >
                    <Plus color={`${isHighContrast ? "blue" : "black"}`} />
                </Button>
            </div>
            <p
                className={`text-xl ${
                    isHighContrast ? "text-white" : "text-black"
                }`}
            >
                {title}
            </p>
            {categories.map((c, i) => (
                <CategoryCard
                    key={i}
                    category={c}
                    label={categoryLabels[c] ?? c}
                    isSelected={c === selectedCategory}
                    onClick={() => onSelectedCategoryChange(c)}
                />
            ))}
        </div>
    );
}

interface InventoryItemCardProps {
    item: Ingredient;
    isSelected: boolean;
    onSelect: () => void;
    onUnselect: () => void;
}

function ToppingCard({
    item,
    isSelected,
    onSelect,
    onUnselect,
}: InventoryItemCardProps) {
    const { isHighContrast } = useAccessibility();
    let selected = isSelected;
    return (
        <div
            className={`flex-col items-center justify-center border rounded p-4 cursor-pointer ${
                isHighContrast
                    ? selected
                        ? "text-blue-400"
                        : ""
                    : selected
                      ? "bg-black text-white"
                      : ""
            }`}
            onClick={() => {
                if (selected) {
                    onUnselect();
                } else {
                    onSelect();
                }
            }}
        >
            <p className="text-center select-none">{item.name}</p>
            <p className="text-center select-none">(${item.cost})</p>
        </div>
    );
}

interface ToppingSelectorProps {
    onToppingSelect: (list: Ingredient[], id: string) => void;
    ingredientType: string;
    multiSelect: boolean;
    globalToppings: Map<string, Ingredient[]>;
}

function ToppingSelector({
    onToppingSelect,
    ingredientType,
    multiSelect,
    globalToppings,
}: ToppingSelectorProps) {
    const [selected, setSelected] = useState<Ingredient[]>([]);

    useEffect(() => {
        const globalSelection = globalToppings.get(ingredientType) || [];
        setSelected(globalSelection);
    }, [globalToppings, ingredientType]);

    return (
        <div className={`grid grid-cols-4 gap-2`}>
            {inventory
                .filter((i) => i.ingredient_group === ingredientType)
                .map((i) => (
                    <ToppingCard
                        key={i.id}
                        item={i}
                        isSelected={selected.includes(i)}
                        onSelect={() => {
                            let localArr = multiSelect ? [...selected, i] : [i];
                            setSelected(localArr);
                            onToppingSelect(localArr, ingredientType);
                        }}
                        onUnselect={() => {
                            const localArr = selected.filter(
                                (item) => item.id !== i.id,
                            );
                            setSelected(localArr);
                            onToppingSelect(localArr, ingredientType);
                        }}
                    />
                ))}
        </div>
    );
}

interface MenuItemCardProps {
    item: MenuItem;
    onConfirm: (item: CartItem) => void;
    addToOrderLabel: string;
    speak: (text: string) => void;
}

const iceToPercentage = (servings: number): string => {
    const mapping: { [key: number]: string } = {
        0: "0%",
        1: "25%",
        2: "50%",
        3: "75%",
        4: "100%",
    };
    return mapping[servings] || "0%";
};

function MenuItemCard({
    item,
    onConfirm,
    addToOrderLabel,
    speak,
}: MenuItemCardProps) {
    const { isHighContrast, textMultipler } = useAccessibility();

    const [open, setOpen] = useState(false);

    const [ice, setIce] = useState(4);
    const [size, setSize] = useState<DrinkSize>("medium");

    let selectedToppings = globalToppingsGroups;

    function setToppingsForType(list: Ingredient[], id: string) {
        selectedToppings.set(id, list);
    }

    type ScalarServing = {
        item: { name: string; id: number };
        amount: number;
    };

    const [scalarServings, setScalarServings] = useState<ScalarServing[]>([]);

    useEffect(() => {
        if (open) {
            setScalarServings(
                scaleItems.map((sItem) => ({
                    item: sItem,
                    amount: 0,
                })),
            );
        }
    }, [open]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setIce(4);
            setSize("medium");

            const blackTea = inventory.find(
                (item) =>
                    item.ingredient_group === "Tea" &&
                    item.name === "Black Tea",
            );

            setToppingsForType(blackTea ? [blackTea] : [], "Tea");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <div
                    className={`relative flex flex-col gap-2 items-center 
                    ${isHighContrast ? "bg-black" : "bg-gray-100"} p-2 rounded border
                    ${isHighContrast ? "text-white" : "text-black"}
                `}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            speak(`${item.name}. $${item.cost.toFixed(2)}`);
                        }}
                        className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full text-sm shadow z-10"
                    >
                        🔊
                    </button>

                    {item.image_url !== "" && item.image_url !== null ? (
                        <img
                            src={item.image_url}
                            alt={"drink image"}
                            className={`w-40 h-40 object-cover`}
                        />
                    ) : (
                        <CupSoda width={120} height={120} />
                    )}
                    <span className="font-semibold text-center">
                        {item.name}
                    </span>
                    <span className="text-sm font-medium">
                        ${item.cost.toFixed(2)}
                    </span>
                </div>
            </DialogTrigger>
            <DialogContent
                className={`max-h-9/10 overflow-y-scroll
                    ${isHighContrast ? "text-white" : "text-black"}
                    ${isHighContrast ? "bg-black" : "bg-gray-100"}
                `}
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Customize {item.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4">
                    <div>
                        {scaleItems.map((sItem, index) => {
                            return (
                                <div key={index}>
                                    <p className="text-2xl">{sItem.name}</p>
                                    <div className="flex space-x-4">
                                        {[0, 1, 2, 3, 4].map((servings) => {
                                            const isSelected =
                                                scalarServings[index] != null &&
                                                scalarServings[index]
                                                    ?.amount === servings;
                                            return (
                                                <div
                                                    key={`${sItem.id}${servings}`}
                                                    className={`cursor-pointer duration-300 border rounded-full p-4 text-xl ${
                                                        isSelected
                                                            ? "bg-black text-white"
                                                            : ""
                                                    }`}
                                                    onClick={() => {
                                                        setScalarServings(
                                                            (prev) => {
                                                                const copy = [
                                                                    ...prev,
                                                                ];
                                                                if (
                                                                    !copy[index]
                                                                ) {
                                                                    copy[
                                                                        index
                                                                    ] = {
                                                                        item: sItem,
                                                                        amount: servings,
                                                                    };
                                                                } else {
                                                                    copy[
                                                                        index
                                                                    ] = {
                                                                        ...copy[
                                                                            index
                                                                        ],
                                                                        amount: servings,
                                                                    };
                                                                }
                                                                return copy;
                                                            },
                                                        );
                                                    }}
                                                >
                                                    {iceToPercentage(servings)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-col space-y-4">
                        {Array.from(globalToppingsGroups.keys()).map((key) => {
                            if (key === "Toppings") {
                                return (
                                    <div key={key}>
                                        <p className="text-2xl mb-3">{key}</p>
                                        <ToppingSelector
                                            globalToppings={selectedToppings}
                                            onToppingSelect={setToppingsForType}
                                            ingredientType={key}
                                            multiSelect={true}
                                        />
                                    </div>
                                );
                            }
                            if (key === "Size") {
                                return (
                                    <div key={key}>
                                        <p className="text-2xl">Size</p>
                                        <div className="flex space-x-4">
                                            <div
                                                className={`cursor-pointer duration-300 border rounded-full p-4 text-xl 
                                                ${
                                                    isHighContrast
                                                        ? size === "small"
                                                            ? "bg-black text-blue-500"
                                                            : ""
                                                        : size === "small"
                                                          ? "bg-black text-white"
                                                          : ""
                                                }`}
                                                onClick={() => setSize("small")}
                                            >
                                                S
                                            </div>
                                            <div
                                                className={`cursor-pointer duration-300 border rounded-full p-4 text-xl 
                                                 ${
                                                     isHighContrast
                                                         ? size === "medium"
                                                             ? "bg-black text-blue-500"
                                                             : ""
                                                         : size === "medium"
                                                           ? "bg-black text-white"
                                                           : ""
                                                 }`}
                                                onClick={() =>
                                                    setSize("medium")
                                                }
                                            >
                                                M
                                            </div>
                                            <div
                                                className={`cursor-pointer duration-300 border rounded-full p-4 text-xl  ${
                                                    isHighContrast
                                                        ? size === "large"
                                                            ? "bg-black text-blue-500"
                                                            : ""
                                                        : size === "large"
                                                          ? "bg-black text-white"
                                                          : ""
                                                }`}
                                                onClick={() => setSize("large")}
                                            >
                                                L
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={key}>
                                    <p className="text-2xl mb-3">{key}</p>
                                    <ToppingSelector
                                        globalToppings={selectedToppings}
                                        onToppingSelect={setToppingsForType}
                                        ingredientType={key}
                                        multiSelect={false}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="default"
                            className="w-full"
                            onClick={() => {
                                let allCustomizations = Array.from(
                                    selectedToppings.values(),
                                ).flatMap((topArr) =>
                                    topArr.map((t) => ({
                                        id: t.id,
                                        name: t.name,
                                        cost: t.cost,
                                        amount: 1,
                                    })),
                                );

                                switch (size) {
                                    case "small":
                                        const smallCup = inventory.find(
                                            (i) => i.id === 23,
                                        )!;
                                        allCustomizations.push({
                                            id: smallCup.id,
                                            name: smallCup.name,
                                            cost: smallCup.cost,
                                            amount: 1,
                                        });
                                        break;
                                    case "medium":
                                        const mediumCup = inventory.find(
                                            (i) => i.id === 24,
                                        )!;
                                        allCustomizations.push({
                                            id: mediumCup.id,
                                            name: mediumCup.name,
                                            cost: mediumCup.cost,
                                            amount: 1,
                                        });
                                        break;
                                    case "large":
                                        const largeCup = inventory.find(
                                            (i) => i.id === 22,
                                        )!;
                                        allCustomizations.push({
                                            id: largeCup.id,
                                            name: largeCup.name,
                                            cost: largeCup.cost,
                                            amount: 1,
                                        });
                                        break;
                                }
                                onConfirm({
                                    id: item.id,
                                    ice,
                                    name: item.name,
                                    cost: item.cost,
                                    scalars: scalarServings,
                                    customizations: allCustomizations,
                                });
                            }}
                        >
                            {addToOrderLabel}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface MenuItemsInterface {
    menuData: MenuData;
    selectedCategory: string;
    onItemOrder: (item: CartItem) => void;
    title: string;
    addToOrderLabel: string;
    speak: (text: string) => void;
}

function MenuItems({
    menuData,
    selectedCategory,
    onItemOrder,
    title,
    addToOrderLabel,
    speak,
}: MenuItemsInterface) {
    const { isHighContrast } = useAccessibility();
    return (
        <div className="space-y-4">
            <p
                className={`text-xl ${
                    isHighContrast ? "text-white" : "text-black"
                }`}
            >
                {title}
            </p>
            <div className="grid grid-rows-3 grid-cols-3 gap-4">
                {Object.entries(menuData)
                    .filter(([category]) => category === selectedCategory)
                    .map(([_, items]) =>
                        items.map((item, i) => (
                            <MenuItemCard
                                key={i}
                                item={item}
                                onConfirm={onItemOrder}
                                addToOrderLabel={addToOrderLabel}
                                speak={speak}
                            />
                        )),
                    )}
            </div>
        </div>
    );
}

function CartItemCard({
    item,
    onRemove,
}: {
    item: CartItem;
    onRemove: () => void;
}) {
    const { isHighContrast } = useAccessibility();

    const itemSize = getCartItemSize(item);
    return (
        <div
            className={`rounded p-4 border ${
                isHighContrast
                    ? "bg-black text-white border-4  border-blue-500"
                    : "bg-white text-black border"
            }`}
        >
            <p className="text-xl font-bold">
                {itemSize.charAt(0).toUpperCase() + itemSize.substring(1)}{" "}
                {item.name}
            </p>
            <p>{/*Ice: {iceToPercentage(item.ice)}*/}</p>
            {item.scalars.map((value, index) => {
                return (
                    <p key={index}>
                        {value.item.name}:{iceToPercentage(value.amount)}
                    </p>
                );
            })}
            {item.customizations.map((c) => (
                <p key={c.id}>{c.name}</p>
            ))}
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
                <p>Total: ${calculateSubtotal([item])}</p>
                <Button
                    variant="outline"
                    size="sm"
                    className={
                        isHighContrast ? "border-red-400 text-red-400" : ""
                    }
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </div>
        </div>
    );
}

interface NoReceipt {
    kind: "none";
}
interface EmailReceipt {
    kind: "email";
    email: string;
}

interface TextReceipt {
    kind: "text";
    phoneNumber: string;
}

type ReceiptType = NoReceipt | EmailReceipt | TextReceipt;

interface ReceiptSelectorProps {
    onSubmit: (receiptType: ReceiptType) => void;
}
function ReceiptSelector({ onSubmit }: ReceiptSelectorProps) {
    const [selected, setSelected] = useState<string>("none");
    const [email, setEmail] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const { isHighContrast, textMultipler } = useAccessibility();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    className={`w-full ${
                        isHighContrast ? "border-4 border-green-400" : ""
                    }`}
                >
                    {EN_LABELS.checkout}
                </Button>
            </DialogTrigger>

            <DialogContent
                className={`max-h-[90vh] ${
                    isHighContrast ? "text-white bg-black" : "text-black"
                }`}
            >
                <DialogHeader>
                    <DialogTitle className={`text-center text-2xl`}>
                        {EN_LABELS.confirmOrder}
                    </DialogTitle>
                </DialogHeader>

                <div>
                    <FieldGroup>
                        <FieldSet>
                            <FieldLabel>Receipt</FieldLabel>
                            <FieldDescription>
                                Choose how you'd like your receipt
                            </FieldDescription>
                            <RadioGroup
                                value={selected}
                                onValueChange={setSelected}
                            >
                                <FieldLabel
                                    htmlFor="no-receipt-selector"
                                    className={`border ${
                                        isHighContrast
                                            ? "border-primary"
                                            : "border-secondary"
                                    } ${
                                        isHighContrast
                                            ? "has-data-[state=checked]:border-secondary"
                                            : "has-data-[state=checked]:border-primary"
                                    }`}
                                >
                                    <Field orientation="horizontal">
                                        <RadioGroupItem
                                            value="none"
                                            id="no-receipt-selector"
                                            className={
                                                isHighContrast
                                                    ? "data-[state=checked]:bg-white"
                                                    : ""
                                            }
                                        />
                                        <FieldTitle>No receipt</FieldTitle>
                                    </Field>
                                </FieldLabel>

                                <FieldLabel
                                    htmlFor="email-receipt-selector"
                                    className={`border ${
                                        isHighContrast
                                            ? "border-primary"
                                            : "border-secondary"
                                    } ${
                                        isHighContrast
                                            ? "has-data-[state=checked]:border-secondary"
                                            : "has-data-[state=checked]:border-primary"
                                    }`}
                                >
                                    <Field orientation="horizontal">
                                        <RadioGroupItem
                                            value="email"
                                            id="email-receipt-selector"
                                            className={
                                                isHighContrast
                                                    ? "data-[state=checked]:bg-white"
                                                    : ""
                                            }
                                        />
                                        <FieldContent>
                                            <FieldTitle>Email</FieldTitle>
                                            <FieldDescription>
                                                <Input
                                                    type="email"
                                                    onFocus={() =>
                                                        setSelected("email")
                                                    }
                                                    value={email}
                                                    onChange={(e) =>
                                                        setEmail(e.target.value)
                                                    }
                                                />
                                            </FieldDescription>
                                        </FieldContent>
                                    </Field>
                                </FieldLabel>

                                <FieldLabel
                                    htmlFor="txtmsg-receipt-selector"
                                    className={`border ${
                                        isHighContrast
                                            ? "border-primary"
                                            : "border-secondary"
                                    } ${
                                        isHighContrast
                                            ? "has-data-[state=checked]:border-secondary"
                                            : "has-data-[state=checked]:border-primary"
                                    }`}
                                >
                                    <Field orientation="horizontal">
                                        <RadioGroupItem
                                            value="text"
                                            id="txtmsg-receipt-selector"
                                            className={
                                                isHighContrast
                                                    ? "data-[state=checked]:bg-white"
                                                    : ""
                                            }
                                        />
                                        <FieldContent>
                                            <FieldTitle>
                                                Text Message
                                            </FieldTitle>
                                            <FieldDescription>
                                                <Input
                                                    type="tel"
                                                    onFocus={() =>
                                                        setSelected("text")
                                                    }
                                                    value={phoneNumber}
                                                    onChange={(e) =>
                                                        setPhoneNumber(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </FieldDescription>
                                        </FieldContent>
                                    </Field>
                                </FieldLabel>
                            </RadioGroup>
                        </FieldSet>
                    </FieldGroup>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="default"
                            className={`w-full  ${
                                isHighContrast
                                    ? "border-4 border-green-400"
                                    : ""
                            }`}
                            onClick={() => {
                                switch (selected) {
                                    case "none":
                                        onSubmit({ kind: "none" });
                                        return;
                                    case "email":
                                        onSubmit({ kind: "email", email });
                                        return;

                                    case "text":
                                        onSubmit({
                                            kind: "text",
                                            phoneNumber,
                                        });
                                        return;
                                }
                            }}
                        >
                            {EN_LABELS.yesPlaceOrder}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Cart({
    items,
    setItems,
    labels,
    currency,
    setCurrency,
    formatPrice,
    loyaltyPoints,
    isLoggedIn,
    userId,
    setLoyaltyPoints,
}: {
    items: CartItem[];
    setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
    labels: Labels;
    currency: CurrencyCode;
    setCurrency: React.Dispatch<React.SetStateAction<CurrencyCode>>;
    formatPrice: (amount: number) => string;
    loyaltyPoints: number;
    isLoggedIn: boolean;
    userId: number | null;
    setLoyaltyPoints: React.Dispatch<React.SetStateAction<number>>;
}) {
    const { isHighContrast, textMultipler } = useAccessibility();

    const [useLoyalty, setUseLoyalty] = useState(false);

    // Current cart value before any discounts
    const rawSubtotal = calculateSubtotal(items);

    // Should we apply loyalty on this order?
    const shouldApplyLoyalty =
        isLoggedIn &&
        useLoyalty &&
        loyaltyPoints >= LOYALTY_POINTS_THRESHOLD &&
        items.length > 0;

    // 50 points → up to $5 off, but not below zero
    const LOYALTY_DISCOUNT_VALUE = 5;

    const loyaltyDiscount = shouldApplyLoyalty
        ? Math.min(LOYALTY_DISCOUNT_VALUE, rawSubtotal)
        : 0;

    // Subtotal after loyalty discount
    const subtotal = rawSubtotal - loyaltyDiscount;

    // Tax and final total are computed on the discounted subtotal
    const tax = TAX_RATE * subtotal;
    const total = subtotal + tax;

    const handleRemoveCartItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };
    async function handleCheckout(receiptType: ReceiptType) {
        const res = await fetch("/api/customer/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                drinks: items.map((i) => ({
                    id: i.id,
                    customizations: i.customizations.map((c) => c.id),
                    ice: 0,
                    scalars: i.scalars,
                })),
                employeeId: 1,
                paymentMethod: "CARD",
                receiptType,
                userId,
                useLoyalty,
            }),
        });

        if (res.ok && isLoggedIn) {
            const earnedPoints = Math.floor(subtotal);

            setLoyaltyPoints((prev) => {
                if (shouldApplyLoyalty) {
                    // subtract 50 and add earned points
                    return prev - LOYALTY_POINTS_THRESHOLD + earnedPoints;
                } else {
                    return prev + earnedPoints;
                }
            });
        }

        setItems([]);
        setUseLoyalty(false);
    }

    return (
        <div
            className={`grid grid-rows-[1fr_8fr_1fr] min-h-0 h-[850] gap-4 ${isHighContrast ? "bg-black text-white border-8 border-yellow-200" : ""}`}
        >
            <p
                className={`text-xl mb-4 text-center ${
                    isHighContrast ? "text-white" : "text-black"
                }`}
            >
                {labels.cart}
            </p>
            <ScrollArea
                className={`
                    max-h-[500px] p-3 rounded-md shadow-sm
                    ${
                        isHighContrast
                            ? "bg-black border-2 border-yellow-300"
                            : "bg-white/70 border border-gray-300"
                    }
                `}
            >
                <div className="space-y-4">
                    {items.length === 0 ? (
                        // empty state
                        <p className="text-center text-sm text-gray-500">
                            Your cart is empty
                        </p>
                    ) : (
                        // normal cart items
                        items.map((i, idx) => (
                            <CartItemCard
                                key={idx}
                                item={i}
                                onRemove={() => handleRemoveCartItem(idx)}
                            />
                        ))
                    )}
                    {/* {items.map((i, idx) => (
                        <CartItemCard key={idx} item={i} />
                    ))} */}
                </div>
            </ScrollArea>

            <div
                className={`p-4 border rounded space-y-2 ${
                    textMultipler >= 1.75 ? "text-sm" : "text-md"
                } ${
                    isHighContrast
                        ? "bg-black text-white border-4 border-blue-500"
                        : "bg-white text-black border"
                }`}
            >
                <div className="col-span-2 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>{labels.subtotal}</span>
                        <span>{formatPrice(rawSubtotal)}</span>
                    </div>

                    {shouldApplyLoyalty && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Loyalty discount</span>
                            <span>-{formatPrice(loyaltyDiscount)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span>{labels.tax}</span>
                        <span>{formatPrice(tax)}</span>
                    </div>

                    <div className="flex justify-between font-semibold">
                        <span>{labels.total}</span>
                        <span>{formatPrice(total)}</span>
                    </div>

                    {isLoggedIn && (
                        <div
                            className={`mt-2 p-2 rounded border text-sm ${
                                isHighContrast
                                    ? "bg-black text-white border-blue-400"
                                    : "bg-gray-50 text-black border-gray-300"
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span>Loyalty points:</span>
                                <span className="font-semibold">
                                    {loyaltyPoints}
                                </span>
                            </div>

                            <Button
                                variant={useLoyalty ? "default" : "outline"}
                                className={`mt-2 w-full ${
                                    isHighContrast && useLoyalty
                                        ? "border-4 border-green-400"
                                        : ""
                                }`}
                                disabled={
                                    !items.length ||
                                    loyaltyPoints < LOYALTY_POINTS_THRESHOLD
                                }
                                onClick={() => setUseLoyalty((prev) => !prev)}
                            >
                                {useLoyalty
                                    ? "Using loyalty points on this order"
                                    : loyaltyPoints >= LOYALTY_POINTS_THRESHOLD
                                      ? "Use loyalty points on this order"
                                      : `Earn ${
                                            LOYALTY_POINTS_THRESHOLD -
                                            loyaltyPoints
                                        } more points to redeem`}
                            </Button>

                            <p className="mt-1 text-xs opacity-80">
                                Loyalty will be applied at checkout.
                            </p>
                        </div>
                    )}

                    <ReceiptSelector onSubmit={handleCheckout} />

                    <select
                        className={`rounded border px-2 py-1 text-sm w-full ${
                            isHighContrast
                                ? "bg-black text-white border-white"
                                : "bg-white text-black border-gray-300"
                        }`}
                        value={currency}
                        onChange={(e) =>
                            setCurrency(e.target.value as CurrencyCode)
                        }
                    >
                        {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

function CashierContent() {
    const [selectedCategory, setSelectedCategory] = useState("Fruit Tea");
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const labels = EN_LABELS;

    const [menuData, setMenuData] = useState<MenuData>(emptyMenuData);
    const [menuDataReady, setMenuDataReady] = useState<boolean>(false);

    const translatedMenuData = menuData;

    const categoryLabels = Object.fromEntries(
        Object.keys(menuData).map((c) => [c, c]),
    );

    const { speak } = useTextToSpeech("en-US");
    const { isHighContrast, textMultipler } = useAccessibility();

    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [rates, setRates] = useState<Partial<Record<CurrencyCode, number>>>({
        USD: 1,
    });

    // single useSession call
    const { data: session, status } = useSession();
    const isLoggedIn = status === "authenticated";
    const rawLoyalty = (session?.user as any)?.loyaltyPoints;

    const [loyaltyPoints, setLoyaltyPoints] = useState(
        rawLoyalty != null ? Number(rawLoyalty) : 0,
    );

    // If the session changes, sync state from it
    useEffect(() => {
        if (rawLoyalty != null) {
            setLoyaltyPoints(Number(rawLoyalty));
        }
    }, [rawLoyalty]);

    const userId = (session?.user as any)?.id ?? null;

    useEffect(() => {
        if (currency === "USD") return;

        async function fetchRate() {
            const res = await fetch(`/api/currency?currency=${currency}`);
            const data = await res.json();

            setRates((prev) => ({
                ...prev,
                [currency]: data.data[currency],
            }));
        }

        fetchRate();
    }, [currency]);

    const loadMenuData = async () => {
        setMenuDataReady(false);
        setMenuData({});
        let menuTempData: MenuData = {};
        console.log("loading menu");
        const catRes = await fetch("api/cashier/categories", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!catRes.ok) {
            throw new Error(`GET /api/cashier/categories ${catRes.status}`);
        }
        const cats: Category[] = await catRes.json();
        for (let cat_idx = 0; cat_idx < cats.length; cat_idx++) {
            const cat = cats[cat_idx];
            const queryBody = {
                id: cat.id,
            };
            const queryRes = await fetch("/api/cashier/menu_by_category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryBody),
            });
            const items: MenuItem[] = await queryRes.json();
            menuTempData = { ...menuTempData, [cat.name]: items };
        }
        setMenuData(menuTempData);

        console.log("loading ingredients");
        const ingrRes = await fetch("api/ingredient", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        inventory = await ingrRes.json();

        for (const item of inventory) {
            console.log(
                `id: ${item.id}, name: ${item.name}, stock: ${item.stock}, cost: ${item.cost}, type: ${item.ingredient_type}, group: ${item.ingredient_group}`,
            );
        }

        // reset globals
        scaleItems = [];
        globalToppingsGroups = new Map<string, Ingredient[]>();

        let groups: string[] = [];
        const emptyIngredients: Ingredient[] = [];
        scaleItems = [];
        for (let i: number = 0; i < inventory.length; ++i) {
            const group = inventory[i].ingredient_group;
            if (group === "Scale" && !groups.includes(inventory[i].name)) {
                scaleItems.push({
                    name: inventory[i].name,
                    id: inventory[i].id,
                });
                groups.push(inventory[i].name);
                continue;
            }
            if (group === "Default") {
                continue;
            }
            if (groups.includes(group)) {
                continue;
            }
            globalToppingsGroups.set(group, emptyIngredients);
            groups.push(group);
        }

        console.log(
            globalToppingsGroups.forEach((value, key) => {
                console.log(`key: ${key}, val: ${value}`);
            }),
        );
        console.log(scaleItems);

        setMenuDataReady(true);
    };

    useEffect(() => {
        loadMenuData();
    }, []);

    const formatPrice = useCallback(
        (amount: number) => {
            const rate = rates[currency] ?? 1;
            const converted = amount * rate;
            return `${CURRENCY_SYMBOLS[currency]}${converted.toFixed(2)}`;
        },
        [currency, rates],
    );

    return (
        <div className="min-h-screen bg-[#ffddd233] font-sans dark:bg-black flex flex-col text-white">
            <TopNav subtitle={labels.kioskTitle} variant="kiosk" />

            {/* <div
                className={`flex justify-end px-8 pt-4 gap-2 items-center ${
                    isHighContrast ? "bg-black" : ""
                }`}
            >
                <div className="inline-block">
                    <GoogleTranslate />
                </div>
            </div> */}
            <div className="relative">
                <div className="absolute top-4 right-8 z-50">
                    <GoogleTranslate />
                </div>
            </div>

            <div
                className={`flex-1 px-6 py-4 ${
                    isHighContrast ? "bg-black" : ""
                }`}
            >
                {menuDataReady ? (
                    <div className="mx-auto max-w-6xl grid grid-cols-[1.1fr_2fr_1.2fr] gap-6">
                        <CategorySelector
                            categories={Object.keys(menuData)}
                            selectedCategory={selectedCategory}
                            onSelectedCategoryChange={setSelectedCategory}
                            title={labels.categories}
                            categoryLabels={categoryLabels}
                        />

                        <MenuItems
                            menuData={translatedMenuData}
                            selectedCategory={selectedCategory}
                            onItemOrder={(item) =>
                                setCartItems([...cartItems, item])
                            }
                            title={labels.drinks}
                            addToOrderLabel={labels.addToOrder}
                            speak={speak}
                        />
                        <Cart
                            items={cartItems}
                            setItems={setCartItems}
                            labels={labels}
                            currency={currency}
                            setCurrency={setCurrency}
                            formatPrice={formatPrice}
                            loyaltyPoints={loyaltyPoints}
                            isLoggedIn={isLoggedIn}
                            userId={userId}
                            setLoyaltyPoints={setLoyaltyPoints}
                        />
                    </div>
                ) : (
                    <div className="mx-auto max-w-6xl grid grid-cols-[1.1fr_2fr_1.2fr] gap-6">
                        <CategorySelector
                            categories={["loading"]}
                            selectedCategory={selectedCategory}
                            onSelectedCategoryChange={() =>
                                console.log("bad touch")
                            }
                            title={labels.categories}
                            categoryLabels={categoryLabels}
                        />

                        <div></div>

                        <Cart
                            items={cartItems}
                            setItems={setCartItems}
                            labels={labels}
                            currency={currency}
                            setCurrency={setCurrency}
                            formatPrice={formatPrice}
                            loyaltyPoints={loyaltyPoints}
                            isLoggedIn={isLoggedIn}
                            userId={userId}
                            setLoyaltyPoints={setLoyaltyPoints}
                        />
                    </div>
                )}
                <LogoutButton />
            </div>
        </div>
    );
}

export default function CashierPage() {
    return (
        <SessionProvider>
            <CashierContent />
        </SessionProvider>
    );
}
