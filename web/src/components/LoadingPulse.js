export default function LoadingPulse({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-secondary text-sm">
      <div className="w-4 h-4 border-2 border-border border-t-secondary rounded-full animate-spin" />
      <span>{text}</span>
    </div>
  );
}
