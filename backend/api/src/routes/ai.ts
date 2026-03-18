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

// ── POST /openai  — generate chart data via Claude (no OpenAI needed)
router.post('/openai', async (req: Request, res: Response) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
        return;
    }

    const { query, projectsData } = req.body;

    // Limit project data size to avoid overly large prompts
    let dataContext = '';
    if (Array.isArray(projectsData) && projectsData.length) {
        const slim = projectsData.map((p: any) => ({
            name: p.name, platform_url: p.platform_url, status: p.status,
            stats: p.latest_stats || null,
        }));
        dataContext = `\n\nLive project data (use this for chart values):\n${JSON.stringify(slim)}`;
    }

    const systemPrompt = `You are a data visualization assistant. Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation. Use this exact schema:
{"chartData":{"chartType":"bar","title":"","description":"","data":[],"xKey":"","yKeys":[{"key":"","name":"","color":""}]}}
chartType must be one of: bar, line, area, pie. For pie charts data items need "name" and "value" fields. Use live data if provided, otherwise realistic sample data.${dataContext}`;

    let apiResponse: globalThis.Response;
    try {
        apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: query }],
            }),
        });
    } catch (networkErr: any) {
        res.status(502).json({ error: `Network error reaching Claude: ${networkErr.message}` });
        return;
    }

    if (!apiResponse.ok) {
        const err = await apiResponse.json().catch(() => ({})) as any;
        res.status(apiResponse.status).json({ error: err.error?.message || `Claude API error (${apiResponse.status})` });
        return;
    }

    const data = await apiResponse.json() as any;
    const raw: string = data.content?.[0]?.text || '';

    // Extract JSON — strip code fences, then find the first {...} block
    function extractJson(text: string): any {
        const cleaned = text.replace(/```(?:json)?\n?|\n?```/g, '').trim();
        // Try direct parse first
        try { return JSON.parse(cleaned); } catch {}
        // Try extracting the first {...} block
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error('No valid JSON found in response');
    }

    try {
        const parsed = extractJson(raw);
        res.json(parsed);
    } catch (parseErr: any) {
        res.status(500).json({ error: `Chart generation failed: Claude returned non-JSON. Raw: ${raw.slice(0, 200)}` });
    }
});

export default router;
