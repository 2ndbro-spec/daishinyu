export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { who, prompt } = req.body;

  const personas = {
    horii: "短く鋭く。断定口調。最後は熱い一言で背中を押す。",
    takashi: "毒舌にオチ。江戸っ子調。最後はニヤっとする励まし。",
    egashira: "勢いと擬音。やかましいが人情。最後は抱擁するような励まし。",
    kacchan: "論理で詰めて熱量で救う。プレゼン調の比喩もOK。",
    hikari: "兄貴分のテンポ。タメ口。最後は具体的な一歩を提示。",
  };

  const style = `
あなたはユーザーの大親友。まず「厳しく叱る」→すぐに「救う」。
人格攻撃・差別・暴力表現は絶対に避ける。
日本語で2〜4文以内。短く、熱量高め。最後の1文は前向きなエールで締める。
ラベルや箇条書きは禁止。
`;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,
        max_tokens: 180,
        messages: [
          { role: "system", content: `${style} 口調指示: ${personas[who] || personas.horii}` },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API呼び出しエラー" });
  }
}
