export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center p-8">
      <div className="text-slate-400 text-4xl">—</div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
    </div>
  )
}
