const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { topic, trends = [] } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic required' });

        const prompt = `You are an Ethiopian social media expert. Generate 5 engaging captions for TikTok/Instagram/YouTube about "${topic}". 
Incorporate these trending topics if relevant: ${trends.slice(0,3).join(', ')}.
Return ONLY a JSON array of 5 strings. Each caption should be short (max 80 chars) and include 2-3 hashtags.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: 'You are a creative caption writer.' },
                       { role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.8,
            max_tokens: 300,
            response_format: { type: 'json_object' }
        });
        const result = JSON.parse(completion.choices[0].message.content);
        const captions = Array.isArray(result) ? result : (result.captions || []);
        res.json({ success: true, captions: captions.slice(0,5) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'AI generation failed' });
    }
};