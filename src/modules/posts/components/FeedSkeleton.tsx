export default function FeedSkeleton() {
  return (
    <div className="w-full border border-zinc-800 bg-zinc-900 rounded-lg p-4 relative animate-pulse mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800" />
          <div className="w-32 h-4 bg-zinc-800 rounded" />
        </div>
        <div className="w-8 h-8 rounded bg-zinc-800" />
      </div>

      <div className="w-24 h-5 bg-zinc-800 rounded mb-2" />
      <div className="w-3/4 h-6 bg-zinc-800 rounded mt-2 mb-1" />

      <div className="flex items-center justify-between mt-3 mb-3">
        <div className="w-24 h-4 bg-zinc-800 rounded" />
        <div className="w-20 h-4 bg-zinc-800 rounded" />
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-4 flex-wrap">
        <div className="w-16 h-8 bg-zinc-800 rounded" />
        <div className="w-24 h-8 bg-zinc-800 rounded" />
        <div className="w-20 h-8 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}
