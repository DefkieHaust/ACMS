const statusStyles = {
  active: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  resolved: 'bg-green-100 text-green-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending: 'bg-blue-100 text-blue-700',
  open: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  inactive: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  deleted: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  vacant: 'bg-gray-100 text-gray-600',
  occupied: 'bg-green-100 text-green-700',
};

export default function Badge({ status, className = '' }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {status}
    </span>
  );
}
