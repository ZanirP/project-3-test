// lib/db.ts
import { Client } from "pg";
import {
    MenuItem,
    Ingredient,
    Category,
    Employee,
    SalesDatum,
    InventoryUsageDatum,
    XReportRow,
    ZReportRow,
    Order,
    OrderStatus,
} from "./models";

// Create a single client and connect once
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

let _connected = false;
export async function ensureConnected() {
    if (_connected) return;

    try {
        await client.connect();
    } catch (err: unknown) {
        // If it's the "already connected" error, ignore it
        if (
            err instanceof Error &&
            err.message.includes("Client has already been connected")
        ) {
            // do nothing, client already connected
        } else {
            throw err;
        }
    }

    _connected = true;
}

/**
 * Fetches all menu items from the database.
 */
export async function fetch_all_menu_items(): Promise<MenuItem[]> {
    await ensureConnected();
    const result = await client.query<MenuItem>("SELECT * FROM menu");
    return result.rows;
}

/**
 * Fetch login information from the database by PIN.
 */
export async function fetch_login_information(
    pin: string,
): Promise<{ is_manager: boolean; id: number; name: string }[]> {
    await ensureConnected();
    const query = `
    SELECT is_manager, id, name
    FROM employees
    WHERE pin = $1;
  `;
    const result = await client.query<{
        is_manager: boolean;
        id: number;
        name: string;
    }>(query, [pin]);
    return result.rows;
}

/**
 * Return rows for menu management table (typed & casted).
 */
export async function populate_menu_management_table(): Promise<MenuItem[]> {
    await ensureConnected();
    const { rows } = await client.query<MenuItem>(
        `
    SELECT id, name, category_id, stock, cost::float8 AS cost
    FROM menu
    ORDER BY id
    `,
    );
    return rows;
}

/**
 * Insert a menu item and return the inserted row.
 */
export async function insert_into_menu_management_table(
    name: string,
    categoryId: number | null,
    stock: number,
    cost: number,
): Promise<MenuItem[]> {
    await ensureConnected();
    const { rows } = await client.query<MenuItem>(
        `
    INSERT INTO menu (name, category_id, stock, cost)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, category_id, stock, cost::float8 AS cost
    `,
        [name, categoryId ?? null, stock ?? 0, cost ?? 0],
    );
    return rows;
}

/**
 * Insert an order and return the created order id.
 */
export async function insert_into_orders_table(
    cost: number,
    employeeId: number,
    paymentMethod: "CARD" | "CASH" | string,
): Promise<{ id: number }[]> {
    await ensureConnected();
    const { rows } = await client.query<{ id: number }>(
        `
    INSERT INTO orders (cost, employee_id, payment_method, placed_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id
    `,
        [cost ?? 0, employeeId, paymentMethod ?? "CARD"],
    );
    return rows;
}

/**
 * Delete a menu item by id and return the deleted id.
 */
export async function delete_from_menu_management_table(
    id: number,
): Promise<{ id: number }> {
    await ensureConnected();
    const { rows, rowCount } = await client.query<{ id: number }>(
        `
    DELETE FROM menu
    WHERE id = $1
    RETURNING id
    `,
        [id],
    );

    if (rowCount === 0) {
        throw new Error(`Menu item with id=${id} not found`);
    }
    return rows[0];
}

/**
 * Populate ingredient management table.
 */
export async function populate_ingredient_management_table(): Promise<
    Ingredient[]
> {
    await ensureConnected();
    const { rows } = await client.query<Ingredient>(
        `
    SELECT id, name, stock, cost::float8 AS cost, ingredient_type, ingredient_group
    FROM ingredients
    ORDER BY id
    `,
    );
    return rows;
}

/**
 * Link a drink (menu item) to an order.
 */
export async function insert_into_drinks_orders_table(
    menuId: number,
    orderId: number,
): Promise<{ id: number }[]> {
    await ensureConnected();
    const { rows } = await client.query<{ id: number }>(
        `
    INSERT INTO drinks_orders (menu_id, order_id)
    VALUES ($1, $2)
    RETURNING id
    `,
        [menuId, orderId],
    );
    return rows;
}

/**
 * Insert an ingredient and return the inserted row.
 */
export async function insert_into_ingredient_management_table(
    name: string,
    stock: number,
    cost: number,
): Promise<Ingredient[]> {
    await ensureConnected();
    const { rows } = await client.query<Ingredient>(
        `
    INSERT INTO ingredients (name, stock, cost)
    VALUES ($1, $2, $3)
    RETURNING id, name, stock, cost::float8 AS cost
    `,
        [name, stock ?? 0, cost ?? 0],
    );
    return rows;
}

/**
 * Decrement menu stock safely (parameterized).
 */
export async function update_menu_inventory(
    amount: number,
    menu_id: number,
): Promise<void> {
    await ensureConnected();
    await client.query(
        `
    UPDATE menu
    SET stock = stock - $1
    WHERE id = $2
    `,
        [amount, menu_id],
    );
}

/**
 * Insert mapping in drinks_ingredients.
 */
export async function insert_into_drinks_ingredients_table(
    drinkId: number,
    ingredientId: number,
    servings: number,
): Promise<{ id: number }[]> {
    await ensureConnected();
    const { rows } = await client.query<{ id: number }>(
        `
    INSERT INTO drinks_ingredients (drink_id, ingredient_id, servings)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
        [drinkId, ingredientId, servings],
    );
    return rows;
}

/**
 * Decrement ingredient stock safely (parameterized).
 */
export async function update_ingredient_inventory(
    amount: number,
    ingredient_id: number,
): Promise<void> {
    console.log(`id: ${ingredient_id} : num: ${amount}`);
    await ensureConnected();
    await client.query(
        `
    UPDATE ingredients
    SET stock = stock - $1
    WHERE id = $2
    `,
        [amount, ingredient_id],
    );
}

/**
 * Delete an ingredient by id and return the deleted id.
 */
export async function delete_from_ingredient_management_table(
    id: number,
): Promise<{ id: number }> {
    await ensureConnected();
    const { rows, rowCount } = await client.query<{ id: number }>(
        `
    DELETE FROM ingredients
    WHERE id = $1
    RETURNING id
    `,
        [id],
    );

    if (rowCount === 0) {
        throw new Error(`Ingredient with id=${id} not found`);
    }
    return rows[0];
}

/**
 * Update a menu item by id and return the updated row.
 */
export async function update_menu_management_table(
    id: number,
    name: string,
    categoryId: number | null,
    stock: number,
    cost: number,
): Promise<MenuItem> {
    await ensureConnected();
    const { rows, rowCount } = await client.query<MenuItem>(
        `
    UPDATE menu
       SET name = $2,
           category_id = $3,
           stock = $4,
           cost = $5
     WHERE id = $1
     RETURNING id, name, category_id, stock, cost::float8 AS cost
    `,
        [id, name, categoryId ?? null, stock, cost],
    );

    if (rowCount === 0) {
        throw new Error(`Menu item with id=${id} not found`);
    }
    return rows[0];
}

/**
 * Update an ingredient by id and return the updated row.
 */
export async function update_ingredient_management_table(
    id: number,
    name: string,
    stock: number,
    cost: number,
): Promise<Ingredient> {
    await ensureConnected();
    const { rows, rowCount } = await client.query<Ingredient>(
        `
    UPDATE ingredients
       SET name = $2,
           stock = $3,
           cost  = $4
     WHERE id = $1
     RETURNING id, name, stock, cost::float8 AS cost
    `,
        [id, name, stock, cost],
    );

    if (rowCount === 0) {
        throw new Error(`Ingredient with id=${id} not found`);
    }
    return rows[0];
}

/**
 * Fetch all employees.
 */
export async function fetch_employee_data(): Promise<Employee[]> {
    await ensureConnected();
    const { rows } = await client.query<Employee>(
        "SELECT * FROM employees ORDER BY id",
    );
    return rows;
}

/**
 * Remove an employee by id and return the removed row (or null).
 */
export async function remove_employee(id: number): Promise<Employee | null> {
    await ensureConnected();
    const { rows } = await client.query<Employee>(
        "DELETE FROM employees WHERE id = $1 RETURNING *",
        [id],
    );
    return rows.length === 0 ? null : rows[0];
}

/**
 * Update an employee by id and return the updated row (or null).
 */
export async function updateEmployee(
    id: number,
    newName: string,
    newHoursWorked: number,
    newPin: number,
): Promise<Employee | null> {
    await ensureConnected();
    const { rows } = await client.query<Employee>(
        `
    UPDATE employees
       SET name = $2,
           hours_worked = $3,
           pin = $4
     WHERE id = $1
     RETURNING *
    `,
        [id, newName, newHoursWorked, newPin],
    );
    return rows.length === 0 ? null : rows[0];
}

export async function fetch_categories(): Promise<Category[]> {
    await ensureConnected();
    const { rows } = await client.query<Category>(
        `SELECT id, name, stock FROM categories ORDER BY id`,
    );
    return rows;
}

export async function fetch_menu_by_category(
    categoryId: number,
): Promise<MenuItem[]> {
    await ensureConnected();
    const { rows } = await client.query<MenuItem>(
        `SELECT id, name, category_id, stock, cost::float8 AS cost, image_url FROM menu WHERE category_id = $1 ORDER BY id`,
        [categoryId],
    );
    return rows;
}
//  X REPORTS AND Z REPORTS

/**
 * Fetch X report data.
 * @returns type of x_rows
 */
export async function fetch_x_report(): Promise<XReportRow[]> {
    await ensureConnected();

    const query = `
    SELECT
        EXTRACT(HOUR FROM placed_at AT TIME ZONE 'America/Chicago') AS sale_hour,
        COUNT(*) AS number_of_sales,
        COALESCE(SUM(cost), 0) AS total_sales
    FROM orders
    WHERE
        (placed_at AT TIME ZONE 'America/Chicago')::date =
            (NOW() AT TIME ZONE 'America/Chicago')::date

        AND EXTRACT(HOUR FROM placed_at AT TIME ZONE 'America/Chicago') <
            EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Chicago')
    GROUP BY 1
    ORDER BY 1;
    `;

    const { rows } = await client.query(query);

    return rows.map((r: any) => ({
        hour: `${String(r.sale_hour).padStart(2, "0")}:00 - ${String(r.sale_hour).padStart(2, "0")}:59`,
        number_of_sales: Number(r.number_of_sales),
        total_sales: Number(r.total_sales),
    }));
}

/**
 * Fetch Z report data.
 * @returns type of z_rows
 */
export async function fetch_z_report(): Promise<ZReportRow[]> {
    await ensureConnected();

    const totalSales = (
        await client.query<{ total: number }>(`
        SELECT COALESCE(SUM(cost), 0)::float8 AS total
        FROM orders
        WHERE placed_at::date = (CURRENT_DATE - INTERVAL '1 day')
    `)
    ).rows[0].total;

    const salesTax = totalSales * 0.0825;

    const cash = (
        await client.query<{ total: number }>(`
        SELECT COALESCE(SUM(cost), 0)::float8 AS total
        FROM orders
        WHERE placed_at::date = (CURRENT_DATE - INTERVAL '1 day')
        AND payment_method = 'CASH'
    `)
    ).rows[0].total;

    const card = (
        await client.query<{ total: number }>(`
        SELECT COALESCE(SUM(cost), 0)::float8 AS total
        FROM orders
        WHERE placed_at::date = (CURRENT_DATE - INTERVAL '1 day')
        AND payment_method = 'CARD'
    `)
    ).rows[0].total;

    const mobile = (
        await client.query<{ total: number }>(`
        SELECT COALESCE(SUM(cost), 0)::float8 AS total
        FROM orders
        WHERE placed_at::date = (CURRENT_DATE - INTERVAL '1 day')
        AND payment_method = 'MOBILE'
    `)
    ).rows[0].total;

    const cardFees = card * 0.02;
    const revenue = totalSales - salesTax - cardFees;

    const openingEmployee =
        (
            await client.query<{ name: string }>(`
        SELECT e.name
        FROM employees e
        JOIN orders o ON e.id = o.employee_id
        WHERE o.placed_at::date = (CURRENT_DATE - INTERVAL '1 day')
        ORDER BY o.placed_at ASC, e.id ASC
        LIMIT 1
    `)
        ).rows[0]?.name ?? "N/A";

    const closingEmployee =
        (
            await client.query<{ name: string }>(`
        SELECT e.name
        FROM employees e
        JOIN orders o ON e.id = o.employee_id
        WHERE o.placed_at::date = (CURRENT_DATE - INTERVAL '1 day')
        ORDER BY o.placed_at DESC, e.id ASC
        LIMIT 1
    `)
        ).rows[0]?.name ?? "N/A";

    const toMoney = (n: number) => `$${n.toFixed(2)}`;

    return [
        { metric: "Total Sales", total: toMoney(totalSales) },
        { metric: "Sales Tax (8.25%)", total: toMoney(salesTax) },
        { metric: "Cash Payments", total: toMoney(cash) },
        { metric: "Card Payments", total: toMoney(card) },
        { metric: "Mobile Payments", total: toMoney(mobile) },
        { metric: "Total Card Fees", total: toMoney(cardFees) },
        { metric: "Total Revenue", total: toMoney(revenue) },
        { metric: "Opening Employee", total: openingEmployee },
        { metric: "Closing Employee", total: closingEmployee },
    ];
}

/**
 * Fetch all ingredients (just name and stock) on low stock (<=50).
 */
export async function lowStockIngredients() {
    await ensureConnected();
    const { rows } = await client.query<Ingredient>(
        `
            SELECT name AS "ingredientName",
            stock FROM ingredients 
            WHERE stock <= 50
            ORDER BY stock ASC
        `,
    );

    return rows;
}

/**
 * Get all the sales between dates provided for the menu items.
 */
export async function salesBetweenDates(startDate: string, endDate: string) {
    await ensureConnected();
    const { rows } = await client.query<SalesDatum>(
        `
                SELECT m.name AS "menuItem", sum(m.cost) AS "sales"
                FROM drinks_orders as dord
                JOIN orders AS o on o.id = dord.order_id
                JOIN menu   AS m on m.id = dord.menu_id
                WHERE o.placed_at >= $1 AND o.placed_at < $2
                GROUP BY m.name
                ORDER BY m.name;
            `,
        [startDate, endDate],
    );

    return rows;
}

/**
 * Get all the inventory usage between dates provided for the menu items.
 */
export async function usageBetweenDates(startDate: string, endDate: string) {
    await ensureConnected();
    const { rows } = await client.query<InventoryUsageDatum>(
        `
                SELECT i.name AS "ingredient", SUM(di.servings) AS "used"
                FROM drinks_orders AS dord
                JOIN orders            AS o   ON o.id = dord.order_id
                JOIN drinks_ingredients AS di ON di.drink_id = dord.id
                JOIN ingredients        AS i  ON i.id = di.ingredient_id
                WHERE o.placed_at >= $1 AND o.placed_at < $2
                GROUP BY i.name
                ORDER BY i.name;
            `,
        [startDate, endDate],
    );

    return rows;
}

/**
 * Fetch orders for the kitchen screen with their menu items + ingredient customizations.
 */
export async function fetch_kitchen_orders_by_status(
    status: OrderStatus,
): Promise<Order[]> {
    await ensureConnected();

    const query = `
        SELECT
            o.id,
            o.placed_at,
            o.cost::float8          AS cost,
            o.employee_id,
            o.payment_method,
            o.order_status,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', m.id,
                        'name', m.name,
                        'category_id', m.category_id,
                        'stock', m.stock,
                        'cost', m.cost::float8,
                        'image_url', m.image_url,
                        'ingredients',
                            COALESCE(
                                (
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', i.id,
                                            'name', i.name,
                                            'servings', di.servings
                                        )
                                    )
                                    FROM drinks_ingredients di
                                    JOIN ingredients i ON i.id = di.ingredient_id
                                    WHERE di.drink_id = dord.id
                                ),
                                '[]'
                            )
                    )
                ) FILTER (WHERE m.id IS NOT NULL),
                '[]'
            ) AS items
        FROM orders o
        LEFT JOIN drinks_orders dord ON dord.order_id = o.id
        LEFT JOIN menu m ON m.id = dord.menu_id
        WHERE o.order_status = $1
        GROUP BY o.id
        ORDER BY o.placed_at ASC;
    `;

    const { rows } = await client.query<Order>(query, [status]);
    return rows;
}

/**
 * Update an order's status (e.g., not_working_on -> working -> completed).
 */
export async function update_order_status(
    orderId: number,
    newStatus: OrderStatus,
): Promise<Order | null> {
    await ensureConnected();

    const query = `
        UPDATE orders
        SET order_status = $1
        WHERE id = $2
        RETURNING
            id,
            placed_at,
            cost::float8 AS cost,
            employee_id,
            payment_method,
            order_status,
            '[]'::json AS items -- we don't need items here; frontend already has them
    `;

    const { rows } = await client.query<Order>(query, [newStatus, orderId]);
    return rows[0] ?? null;
}

export interface CreateOrder {
    drinks: {
        id: number;
        customizations: number[];
        ice?: number; // Ice servings (0-4), optional for backward compatibility
        scalars?: {
            item: {
                name: string;
                id: number;
            };
            amount: number;
        }[];
    }[];
    employeeId: number;
    paymentMethod: string;
    userId?: number | null;
    useLoyalty?: boolean;
}

const TAX_RATE = parseFloat(process.env.NEXT_PUBLIC_TAX_RATE ?? "0.0825");
const ICE_INGREDIENT_NAME = "Ice";

/**
 * Look up an ingredient by name. Returns null if not found.
 */
async function getIngredientByName(name: string): Promise<number | null> {
    await ensureConnected();
    const result = await client.query<{ id: number }>(
        `SELECT id FROM ingredients WHERE name = $1`,
        [name],
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function createOrder({
    drinks,
    employeeId,
    paymentMethod,
    userId,
    useLoyalty,
}: CreateOrder) {
    await ensureConnected();
    try {
        await client.query("BEGIN");

        // Look up Ice ingredient ID once per order
        const iceIngredientId = await getIngredientByName(ICE_INGREDIENT_NAME);
        if (!iceIngredientId) {
            throw new Error(
                `Ingredient "${ICE_INGREDIENT_NAME}" not found in database`,
            );
        }

        // 1) Compute subtotal (pre-tax, before discounts)
        let subtotal = 0;
        console.log(drinks);
        for (const drink of drinks) {
            const drinkCost = Number(
                (
                    await client.query(`SELECT cost FROM menu WHERE id = $1`, [
                        drink.id,
                    ])
                ).rows[0].cost,
            );

            const customizationsCost = await client
                .query(`SELECT SUM(cost) FROM ingredients WHERE id = ANY($1)`, [
                    drink.customizations,
                ])
                .then((res) => res.rows[0].sum)
                .then((n) => (n == null ? 0 : Number(n)));

            subtotal += drinkCost + customizationsCost;
        }

        // Loyalty: fetch current points and decide discount
        let existingPoints = 0;
        let pointsToDeduct = 0;
        let discount = 0;

        if (userId != null) {
            const res = await client.query(
                `SELECT loyalty_points FROM users WHERE id = $1 FOR UPDATE`,
                [userId],
            );
            existingPoints = Number(res.rows[0]?.loyalty_points ?? 0);

            if (useLoyalty && existingPoints >= 50) {
                discount = Math.min(5, subtotal);
                pointsToDeduct = 50;
                subtotal -= discount;
            }
        }

        // Tax + final total, after discount
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;

        const orderId = (
            await client.query(
                `INSERT INTO orders (cost, employee_id, payment_method, user_id) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id`,
                [total, employeeId, paymentMethod, userId ?? null],
            )
        ).rows[0].id as number;

        for (const drink of drinks) {
            const drinksOrdersID = (
                await client.query(
                    `INSERT INTO drinks_orders (menu_id, order_id) VALUES ($1, $2) RETURNING id`,
                    [drink.id, orderId],
                )
            ).rows[0].id as number;

            await update_menu_inventory(1, drink.id);

            // Insert customizations
            if (drink.customizations && drink.customizations.length > 0) {
                await client.query(
                    `INSERT INTO drinks_ingredients (drink_id, ingredient_id, servings) 
                     SELECT $1, unnest($2::int[]), 1`,
                    [drinksOrdersID, drink.customizations],
                );
                await drink.customizations.forEach(async (value) => {
                    await update_ingredient_inventory(1, value);
                });
            }

            //insert scalar values like ice and sugar
            const scalars = drink.scalars ?? [];
            console.log(`scalars: ${drink.scalars}`);
            for (const scale of scalars) {
                if (scale.amount < 1) continue;
                await client.query(
                    `INSERT INTO drinks_ingredients (drink_id, ingredient_id, servings) SELECT $1, $2, $3`,
                    [drinksOrdersID, scale.item.id, scale.amount],
                );
                await update_ingredient_inventory(scale.amount, scale.item.id);
            }

            // Insert ice servings if provided and > 0
            //const iceServings = drink.ice ?? 0;
            //if (iceServings > 0) {
            //    await insert_into_drinks_ingredients_table(
            //        drinksOrdersID,
            //        iceIngredientId,
            //        iceServings,
            //    );
            //}
        }

        // Update loyalty points once per order
        if (userId != null) {
            const earnedPoints = Math.floor(subtotal);
            const newPoints = existingPoints - pointsToDeduct + earnedPoints;

            await client.query(
                `UPDATE users
                SET loyalty_points = $1
                WHERE id = $2`,
                [newPoints, userId],
            );
        }

        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    }
}

export async function getMenuItemById(drinkId: number): Promise<MenuItem> {
    const res = await client.query(`SELECT * FROM menu WHERE id = $1`, [
        drinkId,
    ]);
    if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
            id: Number(row.id),
            name: row.name,
            category_id: row.category_id ? Number(row.category_id) : null,
            stock: Number(row.stock),
            cost: Number(row.cost),
            image_url: row.image_url,
        };
    } else {
        throw `Unknown drink with ID ${drinkId}`;
    }
}

export async function getManyIngredientsByIds(
    ids: number[],
): Promise<Ingredient[]> {
    const res = await client.query(
        `SELECT * FROM ingredients WHERE id = ANY($1)`,
        [ids],
    );

    return res.rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        stock: Number(row.stock),
        cost: Number(row.cost),
        ingredient_type: Number(row.ingredient_type),
        ingredient_group: String(row.ingredient_group),
    }));
}

// insert email into users table. Also, returns all details of even loyalty points for that user.
export async function upsertUserByEmail(email: string) {
    ensureConnected();

    const query = `
        INSERT INTO users (email) 
        VALUES ($1)
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id, email, loyalty_points;
    `;

    const { rows } = await client.query(query, [email]);

    return rows[0];
}
