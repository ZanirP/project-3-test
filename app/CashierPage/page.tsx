"use client";

import { ReactNode, useState, JSX, useMemo, useEffect } from "react";
import Image from "next/image";
import IdleLogout from "@/components/idleLogout";
import TopNav from "@/components/TopNav";
import LogoutButton from "@/components/LogoutButton";
import KitchenButton from "@/components/KitchenButton";

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
import { MenuItem, Category, Ingredient } from "@/lib/models";
import { Button } from "@/components/ui/button";

//[REMOVE WHEN API IS IMPLEMENTED] Temporary data for now
//interface MenuItem {
//    id: number;
//    name: string;
//    stock: number;
//    cost: number;
//}

interface MenuData {
    [categoryName: string]: MenuItem[];
}

const emptyMenuData: MenuData = {};
const emptyInventory: Ingredient[] = [];

// configurable tax rate for UI display (8.25% default)
const TAX_RATE = parseFloat(process.env.NEXT_PUBLIC_TAX_RATE ?? "0.0825");

// price helpers
const findInventoryCost = (name: string, inventory: Ingredient[]) => {
    const item = inventory.find(
        (it) => it.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    return item ? Number(item.cost) : 0;
};

// compute a single order's price from its fields
const getOrderPrice = (order: Record<string, any>, inventory: Ingredient[]) => {
    let price = 0;
    const quantity = (order.quantity as number) || 1;

    for (const [key, value] of Object.entries(order)) {
        if (
            value === "None" ||
            value === null ||
            (Array.isArray(value) && value.length === 0) ||
            key === "quantity"
        )
            continue;

        if (key.toLowerCase() === "drink") {
            price += (value as MenuItem).cost;
            continue;
        }

        if (key === "Ice" || key === "Sugar") continue;

        if (Array.isArray(value)) {
            for (const v of value) price += findInventoryCost(v, inventory);
        } else {
            price += findInventoryCost(String(value), inventory);
        }
    }

    return price * quantity;
};

export default function CashierPage() {
    //Sets default selection for customization options
    const defaultCustomizations = {
        Size: "Medium Cups",
        Ice: "100%",
        Sugar: "100%",
        Boba: "None",
        Jelly: "None",
        Tea: "Black Tea",
        Toppings: [],
    };
    const [inventory, setInventory] = useState<Ingredient[]>(emptyInventory);

    //Serves as the state used for showing the Customization page
    const [isCustomizationOpen, setIsCustomizationOpen] =
        useState<boolean>(false);
    const [selectedCategory, setSelectedCateory] =
        useState<string>("Fruit Tea");
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedCustomizationOptions, setSelectedCustomizationOptions] =
        useState<Record<string, string | string[]>>(defaultCustomizations);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [curOrders, setCurOrders] = useState<
        (Record<string, string | string[] | MenuItem | null | number> & {
            quantity?: number;
        })[]
    >([]);
    const { subtotal, tax, total } = useMemo(() => {
        const sub = curOrders.reduce(
            (sum, o) => sum + getOrderPrice(o, inventory),
            0,
        );
        const t = sub * TAX_RATE;
        const tot = sub + t;
        return {
            subtotal: Math.round(sub * 100) / 100,
            tax: Math.round(t * 100) / 100,
            total: Math.round(tot * 100) / 100,
        };
    }, [curOrders]);
    const [menuData, setMenuData] = useState<MenuData>(emptyMenuData);
    const [menuDataReady, setMenuDataReady] = useState<boolean>(false);

    // for changing payment method
    const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH">("CARD");

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
        //console.log("hey");
        const cats: Category[] = await catRes.json();
        //console.log(`cats length: ${cats.length}`);
        for (let cat_idx = 0; cat_idx < cats.length; cat_idx++) {
            //console.log(`c idx:${cat_idx}`);
            const cat = cats[cat_idx];
            //console.log(cat);
            const queryBody = {
                id: cat.id,
            };
            const queryRes = await fetch("/api/cashier/menu_by_category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryBody),
            });
            const items: MenuItem[] = await queryRes.json();
            //console.log(cat.name);
            menuTempData = { ...menuTempData, [cat.name]: items };
        }
        setMenuData(menuTempData);
        console.log("loading ingredients");
        const ingrRes = await fetch("api/ingredient", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const ingr: Ingredient[] = await ingrRes.json();
        setInventory(ingr);
        setMenuDataReady(true);
    };

    useEffect(() => {
        loadMenuData();
    }, []);

    //Handles whenever a MenuItem is clicked to bring up the customization menu
    const menuItemClicked = (item: MenuItem) => {
        setSelectedCustomizationOptions(defaultCustomizations); //Makes sure to reset the selected options
        setSelectedItem(item);
        setIsCustomizationOpen(true);
    };

    //Handles whenever a CustomizationCard is clicked in order to select it for categories with single select
    const customizationCardClicked = (name: string, category: string) => {
        setSelectedCustomizationOptions({
            ...selectedCustomizationOptions,
            [category]: name,
        });
    };

    //Handles whenever a CustomizationCard is clicked in order to select it for categories with multi-select
    const customizationCardClickedMultipleSelections = (
        name: string,
        category: string,
        isSelected: boolean,
    ) => {
        setSelectedCustomizationOptions((prev) => {
            const currentValue = prev[category] as string[];

            return {
                ...prev,
                [category]: isSelected
                    ? currentValue.filter((item) => item !== name) // remove
                    : [...currentValue, name], // add
            };
        });
    };

    // Handles whenever an order is finalized on the customization side
    const submitOrder = () => {
        // Add the current selection into the total orders
        const existingQuantity =
            editingIndex !== null
                ? (curOrders[editingIndex]?.quantity as number) || 1
                : 1;

        const order = {
            Drink: selectedItem,
            ...selectedCustomizationOptions,
            quantity: existingQuantity,
        };

        if (editingIndex !== null) {
            // Replace the item being edited
            setCurOrders(
                curOrders.map((o, i) => (i === editingIndex ? order : o)),
            );
            setEditingIndex(null);
        } else {
            // Add a new item
            setCurOrders([...curOrders, order]);
        }
        setIsCustomizationOpen(false);
    };

    // Handle removing an item from the cart
    const handleRemoveItem = (index: number) => {
        setCurOrders(curOrders.filter((_, i) => i !== index));
    };

    // Handle increasing quantity
    const handleIncreaseQty = (index: number) => {
        setCurOrders(
            curOrders.map((order, i) =>
                i === index
                    ? {
                          ...order,
                          quantity: ((order.quantity as number) || 1) + 1,
                      }
                    : order,
            ),
        );
    };

    const handleDecreaseQty = (index: number) => {
        setCurOrders(
            curOrders.map((order, i) => {
                if (i === index) {
                    const currentQty = (order.quantity as number) || 1;
                    return { ...order, quantity: Math.max(1, currentQty - 1) };
                }
                return order;
            }),
        );
    };

    const handleEditItem = (index: number) => {
        const orderToEdit = curOrders[index];
        if (orderToEdit) {
            setSelectedItem(orderToEdit.Drink as MenuItem);

            const { Drink, quantity, ...customizations } = orderToEdit;
            setSelectedCustomizationOptions(
                customizations as Record<string, string | string[]>,
            );
            setEditingIndex(index);
            setIsCustomizationOpen(true);
        }
    };

    //handles current order and sends completed order to database
    const checkoutOrder = async (method: "CARD" | "CASH") => {
        //console.log("checking out");
        try {
            let tempCost = 0;
            curOrders.forEach((cOrder) => {
                tempCost += getOrderPrice(cOrder, inventory);
            });
            tempCost = tempCost + tempCost * TAX_RATE;
            const orderBody = {
                cost: Math.round(tempCost * 100) / 100,
                employeeId: "1",
                paymentMethod: method,
            };
            //console.log(orderBody.cost);
            const orderRes = await fetch("api/cashier/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderBody),
            });
            if (!orderRes.ok)
                throw new Error(`POST /api/cashier/order ${orderRes.status}`);
            let { id } = await orderRes.json();
            const orderId = id;
            //console.log(`= order id: ${orderId}`);
            // Process all orders sequentially to avoid race conditions
            for (const [orderIndex, order] of curOrders.entries()) {
                const quantity = (order.quantity as number) || 1;
                // Create multiple drink orders based on quantity
                for (let qtyIndex = 0; qtyIndex < quantity; qtyIndex++) {
                    let drinkOrderId = -1;
                    for (
                        let index = 0;
                        index < Object.entries(order).length;
                        ++index
                    ) {
                        let [key, value] = Object.entries(order)[index];
                        //console.log(`\t= k: ${key}\tv: ${value}\tdo id: ${drinkOrderId}`);
                        if (
                            value === "None" ||
                            value === null ||
                            (Array.isArray(value) && value.length === 0)
                        ) {
                            continue;
                        }
                        if (key.toLowerCase() === "drink") {
                            const drinkOrderBody = {
                                menuId: (value as MenuItem).id,
                                orderId: orderId,
                            };
                            const drinkOrderRes = await fetch(
                                "api/cashier/drinks_order",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(drinkOrderBody),
                                },
                            );
                            let { id } = await drinkOrderRes.json();
                            drinkOrderId = id;
                        } else {
                            let ingredientAmmount = 0;
                            let ingredientTemp: Ingredient | any = inventory[0];
                            if (key === "Ice" || key === "Sugar") {
                                if (value === "100%") {
                                    ingredientAmmount = 4;
                                } else if (value === "75%") {
                                    ingredientAmmount = 3;
                                } else if (value === "50%") {
                                    ingredientAmmount = 2;
                                } else if (value === "25%") {
                                    ingredientAmmount = 1;
                                } else {
                                    continue;
                                }
                                ingredientTemp = { id: 28, name: "Ice" };
                            } else if (key === "Size") {
                                continue;
                            } else if (Array.isArray(value)) {
                                ingredientAmmount = 1;
                                value.forEach(async (ingredientName) => {
                                    ingredientTemp = inventory.find((cItem) => {
                                        if (cItem.name == ingredientName) {
                                            return cItem;
                                        }
                                    });

                                    if (ingredientTemp == null) {
                                        console.log("==bad ingredient name==");
                                        return;
                                    }

                                    const drinkIngredientBody = {
                                        drink_id: drinkOrderId,
                                        ingredient_id: ingredientTemp.id,
                                        servings: ingredientAmmount,
                                    };
                                    await fetch(
                                        "api/cashier/drink_ingredients",
                                        {
                                            method: "POST",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify(
                                                drinkIngredientBody,
                                            ),
                                        },
                                    );
                                });
                                continue;
                            } else {
                                ingredientAmmount = 1;
                                ingredientTemp = inventory.find((cItem) => {
                                    if (cItem.name == value) {
                                        return cItem;
                                    }
                                });
                            }

                            if (ingredientTemp == null) {
                                console.log("\t\t==bad ingredient name==");
                                continue;
                            }

                            const drinkIngredientBody = {
                                drink_id: drinkOrderId,
                                ingredient_id: ingredientTemp.id,
                                servings: ingredientAmmount,
                            };
                            await fetch("api/cashier/drink_ingredients", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(drinkIngredientBody),
                            });
                        }
                    }
                }
            }
        } catch (e: any) {
            console.error("Checkout error:", e);
            alert(`Checkout failed: ${e.message || "Unknown error"}`);
        }
        setCurOrders([]);
    };

    //Used as a button for each category in the Cashier page
    const Category = ({ name }: { name: string }) => {
        return (
            <div
                className="shadow-lg w-[90%] h-15 flex justify-center items-center bg-[#b2b2b256] border-1 border-black rounded-md transform transition-transform duration-100 hover:scale-105"
                onClick={() => setSelectedCateory(name)}
            >
                {name}
            </div>
        );
    };

    //Used as a button for each category in the Customization page
    const CustomizationCategory = ({
        name,
        children,
    }: {
        name: string;
        children?: ReactNode;
    }) => {
        return (
            <div className="w-full">
                <h2 className="font-semibold text-xl mt-3 mb-2">{name}</h2>
                <div className="flex gap-8">{children}</div>
            </div>
        );
    };

    //Used to contain items for each customization category and handle filtering
    const CustomizationData = ({
        isOneItem = true,
        allowsMultipleSelections = false,
        toFilterBy = "",
        category,
    }: {
        isOneItem: boolean;
        allowsMultipleSelections: boolean;
        toFilterBy: string;
        category: string;
    }) => {
        console.log(category);
        const itemsToIgnore = ["napkins", "straws", "seal", "bag"];

        interface OptionItem {
            name: string;
            is_disabled: boolean;
        }

        const options: OptionItem[] =
            //Checks if the category is for one item (ex: Ice) or multiple items (ex: Boba)
            //When the API is implemented, we can associate each item with a category and remove all this
            isOneItem
                ? ["0%", "25%", "50%", "75%", "100%"].map((label) => ({
                      //If it is just one item, we just have the customization be the amount of said item
                      name: label,
                      is_disabled: false,
                  }))
                : category === "Toppings" //The toppings category has every item that is not tea, boba, jelly, or ice/sugar
                  ? inventory
                        .filter((i) => {
                            const n = i.name.trim().toLowerCase();
                            return (
                                ![
                                    "cups",
                                    "tea",
                                    "boba",
                                    "jelly",
                                    "ice",
                                    "sugar",
                                ].some((s) => n.endsWith(s)) &&
                                !itemsToIgnore.includes(n) //Performs the exclusion of the specific item types
                            );
                        })
                        .map((i) => ({
                            name: i.name,
                            is_disabled: i.stock < 1,
                        }))
                  : inventory //Here we assume it's a normal category otherwise (tea, boba, jelly, ice/sugar)
                        .filter(
                            (i) =>
                                i.name
                                    .trim()
                                    .toLowerCase()
                                    .endsWith(toFilterBy.trim().toLowerCase()), //Identifies the item type by the last word in its string (ex: Popping Boba -> Boba)
                        )
                        .map((i) => ({
                            name: i.name,
                            is_disabled: i.stock < 1,
                        }));

        return (
            <div className="flex flex-wrap gap-8">
                {options
                    .slice() // to avoid mutating the original array
                    .sort((a, b) => {
                        if (category === "Size") {
                            const sizeOrder = [
                                "Small Cups",
                                "Medium Cups",
                                "Large Cups",
                            ];
                            return (
                                sizeOrder.indexOf(a.name) -
                                sizeOrder.indexOf(b.name)
                            );
                        }
                        return 0; // No sorting for other categories
                    })
                    .map((item) => {
                        const isSelected: boolean = allowsMultipleSelections
                            ? selectedCustomizationOptions[category].includes(
                                  item.name,
                              )
                            : item.name ===
                              selectedCustomizationOptions[category];

                        return (
                            <CustomizationCard
                                key={`customizationcard-${category}-${item.name}`}
                                itemName={item.name}
                                isDisabled={item.is_disabled}
                                isSelected={isSelected}
                                whenClicked={
                                    allowsMultipleSelections
                                        ? () =>
                                              customizationCardClickedMultipleSelections(
                                                  item.name,
                                                  category,
                                                  isSelected,
                                              )
                                        : () =>
                                              customizationCardClicked(
                                                  item.name,
                                                  category,
                                              )
                                }
                            />
                        );
                    })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#ffddd233] font-sans dark:bg-black flex flex-col">
            {/* Top navigation bar */}
            <TopNav subtitle="Cashier POS" variant="cashier" />

            {/* Customization dialog (overlay) */}
            <AlertDialog
                open={isCustomizationOpen}
                onOpenChange={(open) => {
                    setIsCustomizationOpen(open);
                    if (!open) {
                        // Reset editing state when dialog closes (cancel, ESC, etc.)
                        setEditingIndex(null);
                    }
                }}
            >
                {/* The reason we override small is because that's the only way we can adjust the width of the AlertDialog */}
                <AlertDialogContent className="w-[90vw] h-[90vh] max-w-none sm:max-w-4xl p-8 ">
                    <AlertDialogTitle className="font-semibold text-3xl">
                        Customize Order
                    </AlertDialogTitle>

                    <div className="max-h-[800px] overflow-y-auto pr-2">
                        <CustomizationCategory name="Size">
                            <CustomizationData
                                isOneItem={false}
                                toFilterBy="cups"
                                category="Size"
                                allowsMultipleSelections={false}
                            />
                        </CustomizationCategory>

                        <CustomizationCategory name="Ice">
                            <CustomizationData
                                isOneItem={true}
                                toFilterBy="ice"
                                category="Ice"
                                allowsMultipleSelections={false}
                            />
                        </CustomizationCategory>

                        <CustomizationCategory name="Sugar">
                            <CustomizationData
                                isOneItem={true}
                                toFilterBy="sugar"
                                category="Sugar"
                                allowsMultipleSelections={false}
                            />
                        </CustomizationCategory>

                        <CustomizationCategory name="Tea">
                            <CustomizationData
                                isOneItem={false}
                                toFilterBy="tea"
                                category="Tea"
                                allowsMultipleSelections={false}
                            />
                        </CustomizationCategory>

                        <CustomizationCategory name="Boba">
                            <CustomizationData
                                isOneItem={false}
                                toFilterBy="boba"
                                category="Boba"
                                allowsMultipleSelections={true}
                            />
                        </CustomizationCategory>

                        <CustomizationCategory name="Jelly">
                            <CustomizationData
                                isOneItem={false}
                                toFilterBy="jelly"
                                category="Jelly"
                                allowsMultipleSelections={true}
                            />
                        </CustomizationCategory>

                        <CustomizationCategory name="Toppings">
                            <CustomizationData
                                isOneItem={false}
                                toFilterBy="topping"
                                category="Toppings"
                                allowsMultipleSelections={true}
                            />
                        </CustomizationCategory>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setIsCustomizationOpen(false)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={submitOrder}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Main content row under the top nav */}
            <div className="flex flex-1 gap-6 bg-[#ffeee233] justify-between px-6 py-4">
                {/* Left: Categories */}
                <aside className="w-[300px] h-full bg-[#ffeee233] border-2 border-[#a4a4b1ff] flex flex-col justify-center rounded-xl">
                    <h2 className="font-semibold text-3xl mt-3 mb-10 text-center">
                        Categories
                    </h2>
                    <div className="flex flex-col items-center w-full gap-10 pb-6">
                        {menuDataReady ? (
                            Object.entries(menuData).map(([category]) => (
                                <Category key={category} name={category} />
                            ))
                        ) : (
                            <Category name="loading" />
                        )}
                    </div>
                </aside>

                {/* Middle: Menu items */}
                <main className="flex-1 flex items-start justify-center mt-6">
                    <div className="flex flex-wrap gap-16 justify-around">
                        {menuDataReady && menuData[selectedCategory] ? (
                            menuData[selectedCategory].map(
                                (itemData, itemDataIndex) => (
                                    <ItemCard
                                        key={itemDataIndex}
                                        itemName={itemData.name}
                                        whenClicked={() =>
                                            menuItemClicked(itemData)
                                        }
                                    />
                                ),
                            )
                        ) : (
                            <ItemCard
                                itemName="loading"
                                key={0}
                                whenClicked={() => {
                                    console.log("don't touch me!");
                                }}
                            />
                        )}
                    </div>
                </main>

                {/* Right: Checkout */}
                <aside className="w-[330px] h-full bg-[#ffffff00] border-0 border-[#a4a4b1ff] flex flex-col justify-between p-4 rounded-xl">
                    <div>
                        <h2 className="font-semibold text-3xl text-center mt-3 mb-4">
                            Checkout
                        </h2>
                        <div className="bg-[#feffffff] border-1 border-[#a4a4b1ff] rounded-xl p-3 shadow-inner max-h-[60vh] overflow-y-auto">
                            {curOrders.length === 0 ? (
                                <div className="flex items-center justify-center h-full min-h-[200px]">
                                    <p className="text-gray-600 font-medium text-lg">
                                        Cart is empty
                                    </p>
                                </div>
                            ) : (
                                curOrders.map((order, orderIndex) => {
                                    const itemsJSX: JSX.Element[] = [];

                                    Object.entries(order).forEach(
                                        ([key, value]) => {
                                            if (
                                                value === "None" ||
                                                value === null ||
                                                (Array.isArray(value) &&
                                                    value.length === 0)
                                            ) {
                                                return;
                                            }

                                            if (
                                                key.toLowerCase() === "drink" ||
                                                key === "quantity"
                                            ) {
                                                return;
                                            } else if (
                                                key === "Ice" ||
                                                key === "Sugar"
                                            ) {
                                                itemsJSX.push(
                                                    <div
                                                        key={`suborder-${key}-${value}-single`}
                                                        className="bg-[#ffe5ea] px-2 py-1 rounded mb-2"
                                                    >
                                                        {key}: {value as string}
                                                    </div>,
                                                );
                                            } else if (Array.isArray(value)) {
                                                value.forEach((o: string) => {
                                                    const p = findInventoryCost(
                                                        o,
                                                        inventory,
                                                    );
                                                    itemsJSX.push(
                                                        <div
                                                            key={`suborder-${key}-${o}-single`}
                                                            className="bg-[#ffe5ea] px-2 py-1 rounded mb-2"
                                                        >
                                                            {o}{" "}
                                                            {p !== 0
                                                                ? `($${p.toFixed(
                                                                      2,
                                                                  )})`
                                                                : ""}
                                                        </div>,
                                                    );
                                                });
                                            } else {
                                                const p = findInventoryCost(
                                                    String(value),
                                                    inventory,
                                                );
                                                itemsJSX.push(
                                                    <div
                                                        key={`suborder-${key}-${value}-single`}
                                                        className="bg-[#ffe5ea] px-2 py-1 rounded mb-2"
                                                    >
                                                        {String(value)}{" "}
                                                        {p !== 0
                                                            ? `($${p.toFixed(2)})`
                                                            : ""}
                                                    </div>,
                                                );
                                            }
                                        },
                                    );

                                    const order_price = getOrderPrice(
                                        order,
                                        inventory,
                                    );
                                    const quantity =
                                        (order.quantity as number) || 1;

                                    return (
                                        <div
                                            key={`order-${orderIndex}`}
                                            className="bg-[#eef0ff33] border-2 border-[#a4a4b180] rounded-xl p-3 mb-4 shadow flex-col"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    Order {orderIndex + 1}:{" "}
                                                    {
                                                        (
                                                            order.Drink as MenuItem
                                                        )?.name
                                                    }
                                                </h3>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEditItem(
                                                                orderIndex,
                                                            )
                                                        }
                                                        className="h-7 px-2 text-xs bg-[#ffe5ea] hover:bg-[#ffd6dd] border-[#9d8189] text-[#6d6875]"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleRemoveItem(
                                                                orderIndex,
                                                            )
                                                        }
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                            {itemsJSX}
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        Quantity:
                                                    </span>
                                                    <div className="flex items-center gap-1 border border-[#9d8189] rounded-md">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() =>
                                                                handleDecreaseQty(
                                                                    orderIndex,
                                                                )
                                                            }
                                                            className="h-6 w-6 p-0 hover:bg-[#ffe5ea] text-[#6d6875]"
                                                            disabled={
                                                                quantity <= 1
                                                            }
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                                                            {quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() =>
                                                                handleIncreaseQty(
                                                                    orderIndex,
                                                                )
                                                            }
                                                            className="h-6 w-6 p-0 hover:bg-[#ffe5ea] text-[#6d6875]"
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="font-semibold">
                                                    Total: $
                                                    {order_price.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    <div className="bg-[#feffffff] border-1 border-[#a4a4b1ff] rounded-xl p-3 mt-4 shadow-md space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-xl font-semibold mb-3">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full"
                                    disabled={curOrders.length === 0}
                                >
                                    Checkout
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Confirm Checkout
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Select a payment method before
                                        completing the order.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                {/* PAYMENT METHOD DROPDOWN */}
                                <div className="mt-4">
                                    <label className="block text-sm mb-1 font-medium">
                                        Payment Method
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) =>
                                            setPaymentMethod(
                                                e.target.value as
                                                    | "CARD"
                                                    | "CASH",
                                            )
                                        }
                                        className="w-full border px-3 py-2 rounded-md bg-white"
                                    >
                                        <option value="CARD">Card</option>
                                        <option value="CASH">Cash</option>
                                    </select>
                                </div>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() =>
                                            checkoutOrder(paymentMethod)
                                        }
                                    >
                                        Confirm Payment
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </aside>
                <KitchenButton />
                <LogoutButton />
            </div>
        </div>
    );
}
