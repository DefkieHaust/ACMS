export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
        Previous
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 text-sm rounded-lg ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
        Next
      </button>
    </div>
  );
}
