interface Category {
    id: number;
    name: string;
    stock: number;
}

export type OrderStatus = "not_working_on" | "working" | "completed";

interface Order {
    id: number;
    placed_at: string;
    cost: number;
    employee_id: number;
    payment_method: string;
    order_status: OrderStatus;
    items: MenuItem[];
}

interface Employee {
    id: number;
    name: string;
    hours_worked: number;
    is_manager: boolean;
    pin: number;
}

interface MenuItem {
    id: number;
    name: string;
    category_id: number | null;
    stock: number;
    cost: number;
    image_url: string | null;
    ingredients?: DrinkIngredient[];
}

interface Ingredient {
    id: number;
    name: string;
    stock: number;
    cost: number;
    ingredient_type: number;
    ingredient_group: string;
}

interface DrinkIngredient {
    id: number;
    name: string;
    servings: number;
}

interface DrinkOrder {
    id: number;
    menu_id: number;
    order_id: number;
}

interface XReportRow {
    hour: string;
    number_of_sales: number;
    total_sales: number;
}

interface ZReportRow {
    metric: string;
    total: string;
}

interface SalesDatum {
    menuItem: string;
    sales: number;
}

interface InventoryUsageDatum {
    ingredient: string;
    used: number;
}

export type {
    Category,
    Order,
    Employee,
    MenuItem,
    Ingredient,
    DrinkIngredient,
    DrinkOrder,
    XReportRow,
    ZReportRow,
    SalesDatum,
    InventoryUsageDatum,
};
