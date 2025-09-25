export default async function handler(req, res) {
  // CORS（同一ドメインなので必須ではないが一応）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  // 1) 環境変数チェック
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY (Vercel > Settings > Environment Variables)" });

  try {
    // 2) ボディ取得
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { prompt } = body;
    if (!prompt) return res.status(400).json({ error: "no prompt" });

    // 3) OpenAI 呼び出し（まずは通るモデルで）
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        // ★ここを現行の軽量モデルに変更
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content:
            "あなたは“本気で叱り、本気で励ます”大親友AI。強く叱るが、人格攻撃・差別・暴力的表現は避け、最後は必ず前向きな励ましで締める。" },
          { role: "user", content: prompt }
        ],
        max_tokens: 420,
        temperature: 0.9
      })
    });

    const j = await r.json();

    // 4) 失敗時はエラー内容をそのまま返す（原因の可視化）
    if (!r.ok) {
      return res.status(r.status).json({
        error: j?.error?.message || "openai error",
        code: j?.error?.code || null
      });
    }

    const text = j?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "server error" });
  }
}
