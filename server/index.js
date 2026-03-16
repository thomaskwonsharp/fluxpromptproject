// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// If Node < 18: import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const FLOW_ID = '7d04b2d8-e932-4c80-bd5a-2388b34bc070';
const TARGET_INPUT = 'varInputNode_1773327991330_0.6331';
const API_URL = `https://api.fluxprompt.ai/flux/api-v2?flowId=${FLOW_ID}`;
const API_KEY = process.env.FLUXPROMPT_API_KEY;


if (!API_KEY) {
    console.warn('⚠️ FLUXPROMPT_API_KEY is not set; /api/fluxprompt will 500 until you set it.');
}

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        hasApiKey: !!process.env.FLUXPROMPT_API_KEY,
        flowId: FLOW_ID,
        targetInputNode: TARGET_INPUT,
        ts: new Date().toISOString()
    });
});

app.post('/api/fluxprompt', async (req, res) => {
    try {
        const { inputText } = req.body || {};
        if (!inputText || typeof inputText !== 'string') {
            return res.status(400).json({
                error: 'Missing or invalid inputText',
                hint: 'Send JSON { "inputText": "<html>...</html>" }'
            });
        }
        if (!API_KEY) {
            return res.status(500).json({
                error: 'Server misconfiguration: missing FLUXPROMPT_API_KEY'
            });
        }

        const payload = {
            variableInputs: [{ inputId: TARGET_INPUT, inputText }]
        };

        const r = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const text = await r.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }

        if (!r.ok) {
            return res.status(r.status).json({ error: data?.error || 'FluxPrompt request failed', details: data });
        }
        return res.json(data);
    } catch (e) {
        console.error('[Proxy] Unexpected error', e);
        return res.status(500).json({ error: e?.message || 'Server error' });
    }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`Local proxy running at http://localhost:${PORT}`));