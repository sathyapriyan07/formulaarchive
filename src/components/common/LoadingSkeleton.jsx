export default function LoadingSkeleton({ count = 1, className = '' }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`animate-pulse bg-f1-gray rounded-lg ${className}`}>
          <div className="h-full w-full"></div>
        </div>
      ))}
    </>
  )
}
