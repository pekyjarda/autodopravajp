// netlify/functions/distance.js

export default async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const { from, to } = await req.json();
    if (!from || !to) {
      return new Response(
        JSON.stringify({ error: 'Chybí pole "from" nebo "to".' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chybí ORS_API_KEY v env proměnných.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    // 1) Geokódování obou adres (vezmeme první hit)
    async function geocode(text) {
      const url = new URL('https://api.openrouteservice.org/geocode/search');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('text', text);
      url.searchParams.set('size', '1');

      const r = await fetch(url);
      if (!r.ok) throw new Error(`Geocode ${text} failed: ${r.status}`);
      const g = await r.json();
      const feat = g.features?.[0];
      if (!feat) throw new Error(`Nenalezeny souřadnice pro: ${text}`);
      // ORS vrací [lon, lat]
      const [lon, lat] = feat.geometry.coordinates;
      return { lon, lat };
    }

    const [start, end] = await Promise.all([geocode(from), geocode(to)]);

    // 2) Směrování (driving-car)
    const routeUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const r = await fetch(`${routeUrl}?api_key=${apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          [start.lon, start.lat],
          [end.lon, end.lat]
        ]
      })
    });
    if (!r.ok) throw new Error(`Directions failed: ${r.status}`);
    const d = await r.json();

    const meters = d?.routes?.[0]?.summary?.distance ?? 0;
    const km = Math.round((meters / 1000) * 10) / 10; // 1 desetinné místo

    return new Response(
      JSON.stringify({ km }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: 'Server error', detail: String(e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
