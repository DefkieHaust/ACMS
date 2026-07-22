export default function LoadingSkeleton({ lines = 4 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-lg" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}
