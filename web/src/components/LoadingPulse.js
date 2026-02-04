export default function LoadingPulse({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-muted">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
