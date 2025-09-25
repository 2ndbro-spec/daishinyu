export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  // ① キー確認
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY (Vercel環境変数)" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { prompt } = body;
    if (!prompt) return res.status(400).json({ error: "no prompt" });

    // ② OpenAI呼び出し
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // まずは通る型で検証
        messages: [
          { role: "system", content:
            "あなたは“本気で叱り、本気で励ます”大親友AI。強めに叱りつつ、人格攻撃や差別はせず、最後は必ず前向きな励ましで締める。" },
          { role: "user", content: prompt }
        ],
        max_tokens: 420,
        temperature: 0.9
      })
    });

    const j = await r.json();

    // ③ 失敗時のエラーをそのまま返して見える化
    if (!r.ok) {
      return res.status(r.status).json({ error: j.error?.message || "openai error", raw: j });
    }

    const text = j?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "server error" });
  }
}
