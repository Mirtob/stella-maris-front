export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-20 h-20 border-4 border-blue-200 dark:border-brand-border rounded-full"></div>
        
        {/* Spinning Ring */}
        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-900 dark:border-t-blue-400 rounded-full animate-spin"></div>
        
        {/* Center Cross */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-8 h-8 text-blue-900 dark:text-blue-400 animate-pulse">
            <path d="M50 10 L55 45 L50 50 L45 45 Z" fill="currentColor" opacity="0.9" />
            <path d="M90 50 L55 55 L50 50 L55 45 Z" fill="currentColor" opacity="0.9" />
            <path d="M50 90 L45 55 L50 50 L55 55 Z" fill="currentColor" opacity="0.9" />
            <path d="M10 50 L45 45 L50 50 L45 55 Z" fill="currentColor" opacity="0.9" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-white/40 dark:border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-200 dark:bg-blue-800 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-blue-200 dark:bg-blue-800 rounded-lg w-3/4"></div>
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded-lg w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded-lg"></div>
            <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded-lg w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
