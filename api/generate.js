// api/generate.js
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" }); // ← これで一発判定
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { prompt } = body;
    if (!prompt) return res.status(400).json({ error: "no prompt" });

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content:
            "あなたは“本気で叱り、本気で励ます”大親友AI。強めに叱るが、人格攻撃・差別・暴力表現は避け、最後は必ず前向きな励ましで締める。" },
          { role: "user", content: prompt }
        ],
        max_tokens: 420,
        temperature: 0.9
      })
    });

    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || "server error" });
  }
}
