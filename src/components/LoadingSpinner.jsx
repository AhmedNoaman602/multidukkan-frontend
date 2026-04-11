export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
      <div className="relative w-16 h-16">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/10 animate-pulse" />
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-cyan-400 animate-spin transition-all duration-500" />
        
        {/* Inner pulsing blob */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 animate-pulse blur-sm" />
      </div>
      
      {/* Shimmering loading text */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xl font-semibold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-blue-400 to-slate-200 bg-[length:200%_auto] animate-shimmer">
          Loading Data
        </span>
        <span className="text-sm text-slate-500 animate-pulse">
          Please wait a moment
        </span>
      </div>
    </div>
  )
}
