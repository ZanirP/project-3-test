import { NextResponse } from "next/server";
import {
    createOrder,
    CreateOrder,
    getManyIngredientsByIds,
    getMenuItemById,
} from "@/lib/db";
import * as sgMail from "@sendgrid/mail";
import dayjs from "dayjs";

const TAX_RATE = parseFloat(process.env.NEXT_PUBLIC_TAX_RATE ?? "0.0825");

// Only configure SendGrid if we actually have a key
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.warn(
        "[SendGrid] SENDGRID_API_KEY not set. Emails will be skipped (dev mode or misconfigured env).",
    );
}

async function buildOrderSummary(order: CreateOrder): Promise<string> {
    let text = `Order placed on ${dayjs().format("MMM D, YYYY h:mm a")}\n\n`;

    let subtotal = 0;

    for (const drink of order.drinks) {
        const menuItem = await getMenuItemById(drink.id);
        const ingredients = await getManyIngredientsByIds(drink.customizations);

        text += `${menuItem.name} ($${menuItem.cost.toFixed(2)})\n`;
        subtotal += menuItem.cost;

        for (const ingredient of ingredients) {
            text += `  - ${ingredient.name} ($${ingredient.cost.toFixed(2)})\n`;
            subtotal += ingredient.cost;
        }

        text += "-".repeat(20) + "\n";
    }

    const tax = subtotal * TAX_RATE;
    text += `Subtotal: $${subtotal.toFixed(2)}\n`;
    text += `Tax: $${tax.toFixed(2)}\n`;
    text += `Total: $${(subtotal + tax).toFixed(2)}\n`;

    return text;
}

async function sendOrderConfirmationEmail(orderData: CreateOrder, to: string) {
    // In dev, or if no key, just log and skip actual sending
    if (!process.env.SENDGRID_API_KEY) {
        console.log("[Email] Skipping SendGrid send (dev or no API key).");
        console.log("[Email] Would send to:", to);
        console.log(await buildOrderSummary(orderData));
        return;
    }

    try {
        const res = await sgMail.send({
            to,
            from: "csce331-project3@em8237.robinjs.dev",
            subject: "Order Confirmation",
            text: await buildOrderSummary(orderData),
        });

        console.log(
            `Sent order confirmation email. Response code: ${res[0].statusCode}`,
        );
    } catch (err) {
        console.error("Failed to send confirmation email:", err);
        // Don't throw – email failure should NOT break the order
    }
}

// Narrow type for receiptType we expect from the client
type ReceiptType =
    | { kind: "none" }
    | { kind: "email"; email: string }
    | { kind: "text"; phoneNumber: string };

export async function POST(req: Request) {
    try {
        const json = await req.json();
        console.log("Incoming order payload:", json);

        const receiptType = json.receiptType as ReceiptType | undefined;

        const orderData: CreateOrder = {
            drinks: json.drinks,
            employeeId: json.employeeId,
            paymentMethod: json.paymentMethod,
            userId: json.userId ?? null,
            useLoyalty: Boolean(json.useLoyalty),
        };

        await createOrder(orderData);
        console.log("Successfully created order");

        // Handle receipt **after** order is created
        switch (receiptType?.kind) {
            case "none":
            case undefined:
                console.log("No receipt generated");
                break;
            case "email":
                await sendOrderConfirmationEmail(orderData, receiptType.email);
                break;
            case "text":
                console.warn(
                    "WARNING: Text message order confirmation is not implemented.",
                );
                break;
        }

        // 201 Created
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (err) {
        console.error("Error in /api/customer/order:", err);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 },
        );
    }
}
