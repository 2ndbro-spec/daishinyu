// api/generate.js
export default async function handler(req, res) {
  const { prompt } = req.body;

  const messages = [
    {
      role: "system",
      content: "あなたは本気で叱ってくれる大親友AIです。叱った後に必ず励ましも添えてください。"
    },
    { role: "user", content: prompt }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages
      })
    });

    const data = await response.json();
    res.status(200).json({ text: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "APIエラー", detail: err.message });
  }
}
