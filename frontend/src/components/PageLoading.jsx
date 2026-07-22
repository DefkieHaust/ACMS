export default function PageLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}
