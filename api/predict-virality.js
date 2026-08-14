const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { content, trends = [] } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        const prompt = `Analyze the following content for virality potential for Ethiopian audiences on TikTok/Instagram/YouTube.
Content: "${content}"
Trends: ${trends.slice(0,5).join(', ')}
Return a JSON object with fields: score (0-100), level (High/Moderate/Low), sentiment, quality, and a list of 4 actionable insights (string array).`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: 'You are a viral content analyst.' },
                       { role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 400,
            response_format: { type: 'json_object' }
        });
        const result = JSON.parse(completion.choices[0].message.content);
        const insights = result.insights || ['Analyze your hook', 'Add engaging visuals', 'Use trending audio', 'Post at peak hours'];
        const score = result.score || 50;
        const level = result.level || 'Moderate';
        const sentiment = result.sentiment || 'neutral';
        const quality = result.quality || 'average';
        const fullInsights = [
            `🎯 Viral Score: <span class="highlight">${score}%</span> — ${level}`,
            `📊 Quality: ${quality}`,
            `💬 Sentiment: ${sentiment}`,
            ...insights
        ];
        res.json({ success: true, insights: fullInsights.slice(0,6) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Prediction failed' });
    }
};