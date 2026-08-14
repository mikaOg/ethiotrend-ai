const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { content, trends = [] } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        const prompt = `Optimize the following caption for Ethiopian audiences on social media.
Original: "${content}"
Trends: ${trends.slice(0,5).join(', ')}
Return a JSON array of 5 optimization tips (short actionable sentences).`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: 'You are a social media optimization expert.' },
                       { role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 300,
            response_format: { type: 'json_object' }
        });
        const result = JSON.parse(completion.choices[0].message.content);
        const tips = Array.isArray(result) ? result : (result.tips || result);
        res.json({ success: true, tips: tips.slice(0,5) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Optimization failed' });
    }
};