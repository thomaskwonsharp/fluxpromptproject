import { useState } from "react";
import "./styles.css";
import UploadBox from "./components/UploadBox.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import ResultCard from "./components/ResultCard.jsx";

// --- FRONTEND-ONLY MOCK: create a tiny valid PDF blob ---
function makeFakePdfBlob({ winner = "Team A", loser = "Team B" } = {}) {
    // Minimal PDF content; renders as a valid 1-page PDF with a simple title text.
    const pdfText = `%PDF-1.4
1 0 obj <<>> endobj
2 0 obj << /Type /Catalog /Pages 3 0 R >> endobj
3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj
4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >> endobj
5 0 obj << /Length 152 >> stream
BT
/F1 18 Tf
72 720 Td
(Head-to-Head Infographic - MOCK) Tj
0 -28 Td
(Winner: ${winner}) Tj
0 -22 Td
(Loser: ${loser}) Tj
ET
endstream
endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000052 00000 n 
0000000101 00000 n 
0000000155 00000 n 
0000000320 00000 n 
0000000532 00000 n 
trailer << /Size 7 /Root 2 0 R >>
startxref
650
%%EOF`;
    return new Blob([pdfText], { type: "application/pdf" });
}

export default function App() {
    const [file, setFile] = useState(null);
    const [rawHtml, setRawHtml] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [error, setError] = useState("");

    const reset = () => {
        setFile(null);
        setRawHtml("");
        setBusy(false);
        setProgress(0);
        setPdfBlob(null);
        setError("");
    };

    // Fake progress while "converting"
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
            // --- FRONTEND-ONLY MOCK: parse minimal info from HTML to show a winner label ---
            let winner = "Competitor A";
            let loser = "Competitor B";

            // Best-effort: try to infer names from <title> or simple markers in the provided HTML.
            const source = file ? await file.text() : rawHtml;
            const titleMatch = source.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch?.[1]) {
                const parts = titleMatch[1].split(/vs\.?|x|v\.?/i).map(s => s.trim()).filter(Boolean);
                if (parts.length >= 2) {
                    winner = parts[0];
                    loser = parts[1];
                }
            }

            // Pretend we did real work…
            await new Promise(r => setTimeout(r, 900));

            // Produce a fake but valid PDF so the download works now.
            const blob = makeFakePdfBlob({ winner, loser });
            setProgress(100);
            setPdfBlob(blob);
        } catch {
            setError("Something went wrong during mock conversion.");
        } finally {
            stop();
            setBusy(false);
        }
    };

    const handleDownload = () => {
        if (!pdfBlob) return;
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "head-to-head-infographic.pdf";
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
                    Upload a head‑to‑head HTML file or paste raw HTML.
                </div>
            </div>

            <div className="row">
                <div className="card">
                    <UploadBox onFile={setFile} disabled={busy} />
                    <div className="hint">Selected: {file ? file.name : "none"}</div>

                    <div style={{ marginTop: 14 }}>
                        <label htmlFor="rawhtml"><strong>Or paste raw HTML</strong></label>
                        <textarea
                            id="rawhtml"
                            className="input"
                            style={{ height: 160, marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" }}
                            placeholder="&lt;html&gt;...&lt;/html&gt;"
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
                            {busy ? "Converting..." : "Convert to PDF"}
                        </button>
                    </div>

                    {error && <div className="error">{error}</div>}

                    {busy && (
                        <div style={{ marginTop: 16 }}>
                            <ProgressBar value={progress} />
                            <div className="hint" aria-live="polite" style={{ marginTop: 6 }}>
                                Processing (mock)…
                            </div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div style={{ marginBottom: 8 }}>
                        <strong>Result</strong>
                    </div>
                    {!pdfBlob && <div className="hint">Your PDF will appear here when ready.</div>}
                    {pdfBlob && (
                        <ResultCard
                            fileName="head-to-head-infographic.pdf"
                            size={pdfBlob.size}
                            onDownload={handleDownload}
                            onReset={reset}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}