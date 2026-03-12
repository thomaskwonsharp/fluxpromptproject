// server/index.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // if Node < 18, otherwise global fetch is available

const app = express();
app.use(cors());
app.use(express.json());

const FLOW_ID = '7d04b2d8-e932-4c80-bd5a-2388b34bc070';
const TARGET_INPUT = 'varInputNode_1773327991330_0.6331';
const API_URL = `https://api.fluxprompt.ai/flux/api-v2?flowId=${FLOW_ID}`;
const API_KEY = process.env.FLUXPROMPT_API_KEY; // <-- set in your local env

app.post('/api/fluxprompt', async (req, res) => {
    try {
        const { inputText } = req.body || {};
        if (!inputText || typeof inputText !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid inputText' });
        }

        const payload = {
            variableInputs: [{ inputId: TARGET_INPUT, inputText }]
        };

        const r = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `api-key ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await r.json();
        if (!r.ok) {
            return res.status(r.status).json({ error: data?.error || 'FluxPrompt request failed', details: data });
        }

        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e?.message || 'Server error' });
    }
});

const PORT = process.env.PORT || 5174; // any free port
app.listen(PORT, () => console.log(`Local proxy running at http://localhost:${PORT}`));