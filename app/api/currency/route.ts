// GET FUNCTION TO GET LATEST EXCHANGE RATE FOR PASSED IN CURRENCY
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") || "USD";

    const url = `https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.FREE_CURRENCY_API_KEY}&currencies=${currency}`;
    const res = await fetch(url);

    const data = await res.json();

    return Response.json(data);
}
