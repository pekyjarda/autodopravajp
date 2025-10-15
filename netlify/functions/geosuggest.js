// netlify/functions/geosuggest.js
export default async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text') || '';
    const limit = parseInt(searchParams.get('limit')||'5',10);
    if (!text) return new Response(JSON.stringify({ suggestions: [] }), { headers:{'content-type':'application/json'} });

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error:'Missing ORS_API_KEY' }), { status:500, headers:{'content-type':'application/json'} });

    const url = new URL('https://api.openrouteservice.org/geocode/autocomplete');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('text', text);
    url.searchParams.set('size', String(limit));
    url.searchParams.set('boundary.country', 'CZ'); // držme se ČR; můžeš odstranit

    const res = await fetch(url);
    const json = await res.json();
    const suggestions = (json.features||[]).map(f => ({
      label: f.properties.label || f.properties.name
    }));
    return new Response(JSON.stringify({ suggestions }), { headers:{'content-type':'application/json'} });
  } catch (e) {
    return new Response(JSON.stringify({ suggestions: [] }), { headers:{'content-type':'application/json'} });
  }
}
