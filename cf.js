// Vercel / Node Serverless Function：/api/cf
// 用途：瀏覽器打 Cloudflare Workers AI 可能被 CORS 擋，經此中轉
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { targetUrl, payload, authorization } = body;
    if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required' });

    const auth = authorization || req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '') || process.env.CF_API_TOKEN || '';
    if (!token) return res.status(401).json({ success: false, errors: [{ code: 10000, message: 'Missing CF_API_TOKEN' }] });

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload || {})
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err) {
    res.status(500).json({ success: false, errors: [{ code: 500, message: err.message || 'Vercel CF Proxy Error' }] });
  }
};

exports.config = { maxDuration: 60 };
//（注：内容由AI生成）
