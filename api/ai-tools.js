const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tool, topic, content, trends = [] } = req.body;

    // Route to the appropriate tool
    if (tool === 'caption') {
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
      return res.json({ success: true, captions: captions.slice(0,5) });

    } else if (tool === 'virality') {
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
      return res.json({ success: true, insights: fullInsights.slice(0,6) });

    } else if (tool === 'optimize') {
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
      return res.json({ success: true, tips: tips.slice(0,5) });

    } else {
      return res.status(400).json({ error: 'Invalid tool. Use "caption", "virality", or "optimize".' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI tool failed' });
  }
};