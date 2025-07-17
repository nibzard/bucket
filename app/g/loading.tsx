export default function Loading() {
  return (
    <main className="container mx-auto px-2 py-4 md:px-4 md:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Gallery</h1>
          <p className="text-gray-600">Loading...</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-1 sm:gap-2 md:gap-3">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  );
}