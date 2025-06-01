// Trigger redeploy at 2025-06-01 01:30 AM

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const { roomName } = req.body;

  if (!roomName) {
    res.status(400).json({ error: "Missing roomName" });
    return;
  }

  try {
    const apiRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_knocking: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
      }),
    });

    if (apiRes.status === 409) {
      res.json({ url: `https://whisparoom.daily.co/${roomName}` });
      return;
    }
    const data = await apiRes.json();
    if (data.url) {
      res.json({ url: data.url });
    } else {
      res.status(500).json({ error: "No url in Daily response", details: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
