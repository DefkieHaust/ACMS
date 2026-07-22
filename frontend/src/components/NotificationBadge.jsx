export default function NotificationBadge({ count, className }) {
  if (!count || count === 0) return null;
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ${className || ''}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}
