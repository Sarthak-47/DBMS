export default function MetricCard({ label, value, color = 'gold' }) {
  const colors = {
    gold:  'text-gold',
    green: 'text-evgreen',
    amber: 'text-evamber',
    red:   'text-evred',
  }
  return (
    <div className="card p-5">
      <p className="text-muted text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${colors[color] || colors.gold}`}>
        {value ?? 0}
      </p>
    </div>
  )
}
