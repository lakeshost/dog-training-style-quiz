export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = req.headers['x-orchids-secret'];
    if (secret !== process.env.ORCHIDS_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = (body.email || '').trim().toLowerCase();
    const style = (body.style || '').trim(); // EmpathicHandler | StructuredTrainer | LeadershipTrainer
    const tag   = (body.tag || '').trim();   // e.g. Style_StructuredTrainer
    const consent = !!body.consent;

    if (!email)   return res.status(400).json({ error: 'Email required' });
    if (!consent) return res.status(400).json({ error: 'Consent required' });

    const payload = {
      api_key: process.env.EMAILOCTOPUS_API_KEY,
      email_address: email,
      status: 'SUBSCRIBED',
      ...(style ? { fields: { TrainingStyle: style } } : {}),
      ...(tag ? { tags: [tag] } : {})
    };

    const url = `https://emailoctopus.com/api/1.6/lists/${process.env.EMAILOCTOPUS_LIST_ID}/contacts`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();

    if (!r.ok) return res.status(r.status).json({ error: 'EmailOctopus error', details: data });
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}