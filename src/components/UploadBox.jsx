import { useRef } from "react";

export default function UploadBox({ onFile, disabled }) {
    const inputRef = useRef(null);

    const onDrop = (e) => {
        e.preventDefault();
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "text/html") onFile(file);
    };

    const openPicker = () => inputRef.current?.click();

    return (
        <div
            className="upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={openPicker}
            role="button"
            aria-label="Upload HTML file"
            title="Click or drag-and-drop an HTML file"
        >
            <div><strong>Upload head‑to‑head HTML</strong></div>
            <div className="hint">Click or drag an <code>.html</code> file here</div>
            <input
                ref={inputRef}
                type="file"
                accept=".html,text/html"
                style={{ display: "none" }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFile(file);
                }}
                disabled={disabled}
            />
        </div>
    );
}