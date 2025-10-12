// netlify/functions/distance.js
export default async (req) => {
  try {
    if (req.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { from, to } = JSON.parse(req.body || "{}");
    if (!from || !to) {
      return { statusCode: 400, body: "Missing from/to" };
    }

    const apiKey = process.env.ORS_API_KEY; // nastavíš v Netlify
    const enc = encodeURIComponent;

    // 1) Geocoding FROM
    const geoFrom = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${enc(from)}&boundary.country=CZ`
    ).then(r => r.json());

    // 2) Geocoding TO
    const geoTo = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${enc(to)}&boundary.country=CZ`
    ).then(r => r.json());

    const f0 = geoFrom?.features?.[0]?.geometry?.coordinates;
    const t0 = geoTo?.features?.[0]?.geometry?.coordinates;
    if (!f0 || !t0) {
      return { statusCode: 404, body: "Address not found" };
    }

    // 3) Directions (driving)
    const body = {
      coordinates: [f0, t0],
      format: "json"
    };

    const route = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apiKey
        },
        body: JSON.stringify(body)
      }
    ).then(r => r.json());

    const meters = route?.routes?.[0]?.summary?.distance;
    if (!meters && meters !== 0) {
      return { statusCode: 500, body: "No route" };
    }

    const km = Math.round((meters / 1000) * 10) / 10;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ km })
    };

  } catch (e) {
    return { statusCode: 500, body: String(e) };
  }
};
