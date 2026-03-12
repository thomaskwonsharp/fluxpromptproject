export default function ResultCard({ fileName, size, onDownload, onReset }) {
    const kb = Math.round(size / 1024);
    return (
        <div className="result">
            <div>
                <div><strong>{fileName}</strong></div>
                <div className="meta">{kb} KB • PDF</div>
            </div>
            <div className="controls">
                <button className="btn" onClick={onReset}>New</button>
                <button className="btn primary" onClick={onDownload}>Download PDF</button>
            </div>
        </div>
    );
}
