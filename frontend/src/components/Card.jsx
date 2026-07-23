export default function Card({ hover = false, stat = false, className = '', children }) {
  let base = 'bg-white rounded-xl shadow-sm border border-gray-100';
  if (stat) base += ' p-5';
  else base += ' p-6';
  if (hover) base += ' hover:shadow-md hover:border-gray-200 transition-all';
  return <div className={`${base} ${className}`}>{children}</div>;
}
