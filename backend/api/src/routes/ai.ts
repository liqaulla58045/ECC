import { Router, Request, Response } from 'express';

const router = Router();

// ── POST /claude  — proxy to Anthropic API
router.post('/claude', async (req: Request, res: Response) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
        return;
    }

    const { system, messages, max_tokens = 1024 } = req.body;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens,
                system,
                messages,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            res.status(response.status).json({ error: err.error?.message || err.error || 'Anthropic API error' });
            return;
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to reach Anthropic API.' });
    }
});

// ── POST /openai  — generate chart data via OpenAI
router.post('/openai', async (req: Request, res: Response) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
        return;
    }

    const { query } = req.body;

    const systemPrompt = `You are a data visualization assistant. When given a query, return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "chartData": {
    "chartType": "bar" | "line" | "area" | "pie",
    "title": "string",
    "description": "string",
    "data": [...],
    "xKey": "string",
    "yKeys": [{ "key": "string", "name": "string", "color": "#hex" }]
  }
}
For pie charts, data items must have "name" and "value" fields. Use realistic sample data if no real data is provided.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: 1024,
                temperature: 0.3,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query },
                ],
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            res.status(response.status).json({ error: err.error?.message || 'OpenAI API error' });
            return;
        }

        const data = await response.json();
        const raw = data.choices[0]?.message?.content || '{}';

        try {
            const parsed = JSON.parse(raw);
            res.json(parsed);
        } catch {
            // Strip markdown code fences if present
            const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
            res.json(JSON.parse(cleaned));
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to reach OpenAI API.' });
    }
});

export default router;
