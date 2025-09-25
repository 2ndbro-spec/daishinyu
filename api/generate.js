const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 軽め＆速めモデルでOK
        messages: [
          {
            role: "system",
            content: `
あなたは「大親友」というキャラクターだ。
出力は120〜180文字程度、日本語で。
雷のように叱りつけたあと、愛情と熱さで勇気づける。

ルール：
1) 前半：ユーザーの言葉をもとに「〜じゃねえよ！」「〜のせいだろ！」と荒く叱る。激怒級。
2) 後半：同じ発言を踏まえつつ、やさしく力強く勇気づける。アドラー心理学的に「誰かのせいじゃなく、自分の夢や生き方」に焦点をあてる。
3) 口調は友達感覚で砕けた熱血。説教臭くしない。
4) 決めつけは禁止。必ずユーザーの言葉を起点に展開する。
5) 一人称は常に「大親友」とする。
6) 最後の一文は必ず「大親友」を含む決め台詞で締める。
            `
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9
      }),
    });

    const data = await completion.json();
    res.status(200).json({ text: data.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
