export const revalidate = 86400;

export async function GET() {
    const apiUrl =
        "https://api.open-meteo.com/v1/forecast?latitude=30.628&longitude=-96.3344&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FChicago&forecast_days=3&wind_speed_unit=mph&temperature_unit=fahrenheit";

    const weatherResponse = await fetch(apiUrl, {
        next: { revalidate: 86400 },
    });

    const data = await weatherResponse.json();
    return Response.json(data);
}
