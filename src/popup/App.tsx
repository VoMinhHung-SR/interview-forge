/**
 * Popup shell — feature panels will be added in M7.
 */
export default function App() {
  return (
    <div className="w-96 p-4">
      <header className="mb-4 border-b border-slate-200 pb-3">
        <h1 className="text-lg font-semibold text-slate-900">
          Coding Interview Coach
        </h1>
        <p className="text-sm text-slate-500">Extension scaffold ready</p>
      </header>
      <main className="text-sm text-slate-600">
        Open a LeetCode or HackerRank problem to get started.
      </main>
    </div>
  );
}
