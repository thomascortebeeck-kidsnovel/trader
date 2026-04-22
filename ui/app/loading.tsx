// Route-level loading skeleton. Shown during initial server render
// and during navigation while the target page is streaming in.

export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-baseline justify-between pb-2 border-b border-border animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-20 bg-panelAlt rounded" />
          <div className="h-3 w-28 bg-panelAlt rounded" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-5 w-24 bg-panelAlt rounded ml-auto" />
          <div className="h-3 w-16 bg-panelAlt rounded ml-auto" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="panel p-4 animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-panelAlt rounded" />
            <div className="h-4 w-20 bg-panelAlt rounded" />
          </div>
          <div className="h-3 w-full bg-panelAlt rounded" />
          <div className="h-10 w-full bg-panelAlt rounded" />
        </div>
      ))}
    </main>
  );
}
