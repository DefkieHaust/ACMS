const statusStyles = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  unpaid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  overdue: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  vacant: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  occupied: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function Badge({ status, className = '' }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        ['active','paid','resolved','confirmed','completed','occupied'].includes(status) ? 'bg-current' :
        ['in_progress','pending'].includes(status) ? 'bg-current' :
        ['open','unpaid','overdue'].includes(status) ? 'bg-current' :
        'bg-current'
      }`} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
