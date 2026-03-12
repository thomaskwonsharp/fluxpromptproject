export default function ProgressBar({ value = 0 }) {
    return (
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
            <span style={{ width: `${value}%` }} />
        </div>
    );
}