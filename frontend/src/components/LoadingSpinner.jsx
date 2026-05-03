export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-cyber-border" />
        <div className="absolute inset-0 rounded-full border-2 border-t-cyber-cyan border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-cyber-muted text-sm font-mono">{message}</p>
    </div>
  )
}
