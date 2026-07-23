export default function Card({ hover = false, stat = false, className = '', children }) {
  let base = 'bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800';
  if (stat) base += ' p-6';
  else base += ' p-6';
  if (hover) base += ' hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200';
  return <div className={`${base} ${className}`}>{children}</div>;
}
