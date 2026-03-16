import { useState } from "react";
import "./styles.css";
import UploadBox from "./components/UploadBox.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import ResultCard from "./components/ResultCard.jsx";

/**
 * Extract HTML from the "text" field(s) of a FluxPrompt JSON response.
 * The API commonly returns an array at data.message[], each item may have a "text" string.
 * That string may contain a fenced code block ```html ... ```, or plain HTML.
 */
function extractHtmlFromApiResponse(obj) {
    // Gather candidate text fields (handle both array and single object/string)
    const messages =
        obj?.data?.message ??
        obj?.message ??
        obj?.output?.message ??
        obj?.data?.output?.message ??
        [];

    const texts = Array.isArray(messages)
        ? messages
            .map((m) => (typeof m?.text === "string" ? m.text : m))
            .filter((t) => typeof t === "string")
        : typeof messages === "string"
            ? [messages]
            : [];

    // Try each candidate text
    for (const t of texts) {
        // 1) Prefer fenced HTML block: ```html ... ```
        const fence = /```html\s*([\s\S]*?)\s*```/i.exec(t);
        if (fence?.[1]) return fence[1].trim();

        // 2) Any fenced block that looks like HTML
        const anyFence = /```([\s\S]*?)```/i.exec(t);
        if (anyFence?.[1] && /<\s*html[\s>]/i.test(anyFence[1])) {
            return anyFence[1].trim();
        }

        // 3) Raw HTML in the text
        if (/<\s*html[\s>]/i.test(t)) return t.trim();
    }

    // Fallbacks: sometimes providers place HTML directly on output fields
    const candidates = [
        obj?.output?.html,
        obj?.data?.output?.html,
        obj?.output,
        obj?.data?.output,
    ].filter((v) => typeof v === "string");

    for (const c of candidates) {
        if (/<\s*html[\s>]/i.test(c)) return c.trim();
        const fence = /```html\s*([\s\S]*?)\s*```/i.exec(c);
        if (fence?.[1]) return fence[1].trim();
    }

    return null;
}

export default function App() {
    const [file, setFile] = useState(null);
    const [rawHtml, setRawHtml] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultBlob, setResultBlob] = useState(null);
    const [error, setError] = useState("");

    const reset = () => {
        setFile(null);
        setRawHtml("");
        setBusy(false);
        setProgress(0);
        setResultBlob(null);
        setError("");
    };

    // Visual progress while calling the API (UX only)
    const simulateProgress = () => {
        setProgress(10);
        let v = 10;
        const id = setInterval(() => {
            v = Math.min(v + Math.random() * 12, 88);
            setProgress(v);
        }, 280);
        return () => clearInterval(id);
    };

    const handleConvert = async () => {
        if (!file && !rawHtml.trim()) {
            setError("Please upload an HTML file or paste raw HTML.");
            return;
        }

        setBusy(true);
        setError("");
        const stop = simulateProgress();

        try {
            // Obtain the HTML source from either the uploaded file or the text area
            const inputText = file ? await file.text() : rawHtml;

            // Call your local proxy which forwards to FluxPrompt
            const resp = await fetch("/api/fluxprompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inputText })
            });

            const text = await resp.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = { raw: text };
            }

            if (!resp.ok) {
                const msg =
                    data?.error ||
                    data?.message ||
                    `Request failed with ${resp.status}`;
                throw new Error(
                    `${msg}${data?.details ? `\n\nDetails: ${JSON.stringify(data.details, null, 2)}` : ""}`
                );
            }

            // ✅ Extract HTML specifically from the "text" field in the returned JSON
            const outputHtml = extractHtmlFromApiResponse(data);
            if (!outputHtml) {
                // If no HTML found, store the JSON for inspection
                const fallback = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json;charset=utf-8"
                });
                setProgress(100);
                setResultBlob(fallback);
                return;
            }

            // Create a downloadable HTML blob
            const blob = new Blob([outputHtml], { type: "text/html;charset=utf-8" });
            setProgress(100);
            setResultBlob(blob);
        } catch (e) {
            setError(e?.message || "Something went wrong while calling the API.");
        } finally {
            stop();
            setBusy(false);
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
            resultBlob.type?.startsWith("text/html")
                ? "head-to-head-infographic.html"
                : "fluxprompt-response.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container">
            <div className="header">
                <h1>Head‑to‑Head → 1‑Page Infographic</h1>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="sub">
                    Paste/upload HTML to send to the agent. The returned JSON’s <code>data.message[].text</code> will be scanned for a <code>```html</code> block or raw HTML and downloaded.
                </div>
            </div>

            <div className="row">
                <div className="card">
                    <UploadBox onFile={setFile} disabled={busy} />
                    <div className="hint">Selected: {file ? file.name : "none"}</div>

                    <div style={{ marginTop: 14 }}>
                        <label htmlFor="rawhtml">
                            <strong>Or paste raw HTML</strong>
                        </label>
                        <textarea
                            id="rawhtml"
                            className="input"
                            style={{
                                height: 160,
                                marginTop: 8,
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas"
                            }}
                            placeholder="<html>...</html>"
                            value={rawHtml}
                            onChange={(e) => setRawHtml(e.target.value)}
                            disabled={busy}
                        />
                    </div>

                    <div className="controls">
                        <button
                            className="btn ghost"
                            onClick={reset}
                            disabled={busy || (!file && !rawHtml)}
                        >
                            Clear
                        </button>

                        <button
                            className="btn primary"
                            onClick={handleConvert}
                            disabled={busy || (!file && !rawHtml)}
                        >
                            {busy ? "Processing..." : "Convert to PDF"}
                        </button>
                    </div>

                    {error && <div className="error">{error}</div>}

                    {busy && (
                        <div style={{ marginTop: 16 }}>
                            <ProgressBar value={progress} />
                            <div className="hint" aria-live="polite" style={{ marginTop: 6 }}>
                                Processing…
                            </div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div style={{ marginBottom: 8 }}>
                        <strong>Result</strong>
                    </div>
                    {!resultBlob && <div className="hint">Your file will appear here when ready.</div>}
                    {resultBlob && (
                        <ResultCard
                            fileName={
                                resultBlob.type?.startsWith("text/html")
                                    ? "head-to-head-infographic.html"
                                    : "fluxprompt-response.json"
                            }
                            size={resultBlob.size}
                            onDownload={handleDownload}
                            onReset={reset}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}