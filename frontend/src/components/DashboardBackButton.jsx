import { Link } from 'react-router-dom'

export default function DashboardBackButton({
  to = '/manager',
  label = 'Quay lại dashboard',
  className = ''
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white hover:shadow-md ${className}`}
    >
      <span className="text-lg">←</span>
      <span>{label}</span>
    </Link>
  )
}
