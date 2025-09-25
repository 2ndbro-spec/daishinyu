export default async function handler(req, res) {
  // CORS（必要ならドメイン制限を）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { who, prompt } = body;
    if (!prompt) return res.status(400).json({ error: "no prompt" });

    // 口調プロファイル
    const personas = {
      horii:  "短く鋭く。断定口調。最後は熱い一言で背中を押す。",
      takashi:"毒舌にオチ。江戸っ子調。最後はニヤっとする励まし。",
      egashira:"勢いと擬音。やかましいが人情。最後は抱擁するような励まし。",
      kacchan:"論理で詰めて熱量で救う。プレゼン調の比喩もOK。",
      hikari: "兄貴分のテンポ。タメ口。最後は具体的な一歩を提示。"
    };

    // スタイル方針
    const style = `
あなたはユーザーの大親友。まず「厳しく叱る」→すぐに「救う」。
人格攻撃・差別・暴力表現は絶対に避ける。
出力は日本語で2〜4文以内。短く、熱量高め。最後の1文は前向きなエールで締める。
ラベルや箇条書き、[見出し]は禁止。`;

    // OpenAI呼び出し
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,
        max_tokens: 180,
        messages: [
          { role: "system", content: `${style} 口調指示: ${personas[who] || personas.horii}` },
          { role: "user", content: prompt }
        ],
      }),
    });

    // エラーハンドリング
    if (!resp.ok) {
      const errText = await resp.text().catch(()=> "");
      // 429対策のメッセージ
      if (resp.status === 429) {
        return res.status(429).json({ error: "APIエラー(429)：レート/クォータ制限。時間をおいて再試行してくれ。" });
      }
      return res.status(resp.status).json({ error: `APIエラー(${resp.status})`, detail: errText });
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "サーバーエラー" });
  }
}
