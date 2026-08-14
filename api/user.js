const pool = require('../lib/db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { fingerprint } = req.query;
        if (!fingerprint) return res.status(400).json({ error: 'Fingerprint required' });

        let userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
        let user = userRes.rows[0];
        if (!user) {
            await pool.query('INSERT INTO users (fingerprint) VALUES ($1)', [fingerprint]);
            userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
            user = userRes.rows[0];
        }
        res.json({
            success: true,
            user: {
                is_premium: user.is_premium,
                analyses_used: user.analyses_used || 0,
                analyses_limit: user.analyses_limit || 1,
                premium_expiry: user.premium_expiry
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};