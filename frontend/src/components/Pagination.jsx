import Button from './Button';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button onClick={() => onPageChange(page - 1)} disabled={page <= 1} variant="secondary" size="sm">
        Previous
      </Button>
      {pages.map(p => (
        <Button key={p} onClick={() => onPageChange(p)} size="sm"
          variant={p === page ? 'primary' : 'secondary'}>
          {p}
        </Button>
      ))}
      <Button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} variant="secondary" size="sm">
        Next
      </Button>
    </div>
  );
}
