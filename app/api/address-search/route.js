import { NextResponse } from "next/server";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = `${NOMINATIM_ENDPOINT}?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
    query.trim()
  )}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ListingSignalApp/1.0 (contact@listing-signal.com)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed with ${response.status}`);
    }

    const data = await response.json();
    const suggestions = Array.isArray(data)
      ? data.map((item) => ({
          label: item.display_name,
          lat: item.lat,
          lon: item.lon,
          address: item.address || {},
        }))
      : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Address suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
