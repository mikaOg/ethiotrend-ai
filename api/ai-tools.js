const Groq = require('groq-sdk');

module.exports = async (req, res) => {
  // Always set CORS and return JSON
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tool, topic, content, trends = [] } = req.body;

    // Validate tool
    if (!tool) {
      return res.status(400).json({ error: 'Missing "tool" field. Use "caption", "virality", or "optimize".' });
    }

    // Initialize Groq (check API key)
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set' });
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    let result;

    // --- Caption Generator ---
    if (tool === 'caption') {
      if (!topic) return res.status(400).json({ error: 'Topic required for caption generation' });
      const prompt = `You are an Ethiopian social media expert. Generate 5 engaging captions for TikTok/Instagram/YouTube about "${topic}".
Incorporate these trending topics if relevant: ${trends.slice(0,3).join(', ')}.
Return ONLY a JSON array of 5 strings. Each caption should be short (max 80 chars) and include 2-3 hashtags.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a creative caption writer.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      const captions = Array.isArray(parsed) ? parsed : (parsed.captions || []);
      return res.json({ success: true, captions: captions.slice(0,5) });
    }

    // --- Virality Predictor ---
    if (tool === 'virality') {
      if (!content) return res.status(400).json({ error: 'Content required for virality prediction' });
      const prompt = `Analyze the following content for virality potential for Ethiopian audiences on TikTok/Instagram/YouTube.
Content: "${content}"
Trends: ${trends.slice(0,5).join(', ')}
Return a JSON object with fields: score (0-100), level (High/Moderate/Low), sentiment, quality, and a list of 4 actionable insights (string array).`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a viral content analyst.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      const insights = parsed.insights || ['Analyze your hook', 'Add engaging visuals', 'Use trending audio', 'Post at peak hours'];
      const score = parsed.score || 50;
      const level = parsed.level || 'Moderate';
      const sentiment = parsed.sentiment || 'neutral';
      const quality = parsed.quality || 'average';
      const fullInsights = [
        `🎯 Viral Score: <span class="highlight">${score}%</span> — ${level}`,
        `📊 Quality: ${quality}`,
        `💬 Sentiment: ${sentiment}`,
        ...insights
      ];
      return res.json({ success: true, insights: fullInsights.slice(0,6) });
    }

    // --- Content Optimizer ---
    if (tool === 'optimize') {
      if (!content) return res.status(400).json({ error: 'Content required for optimization' });
      const prompt = `Optimize the following caption for Ethiopian audiences on social media.
Original: "${content}"
Trends: ${trends.slice(0,5).join(', ')}
Return a JSON array of 5 optimization tips (short actionable sentences).`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a social media optimization expert.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      const tips = Array.isArray(parsed) ? parsed : (parsed.tips || parsed);
      return res.json({ success: true, tips: tips.slice(0,5) });
    }

    // If tool is unknown
    return res.status(400).json({ error: 'Invalid tool. Use "caption", "virality", or "optimize".' });

  } catch (err) {
    console.error('AI Tools error:', err);
    // Always return JSON, never HTML
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};
