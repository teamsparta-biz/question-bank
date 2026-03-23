const COLORS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
}

interface Props {
  label: string
  color?: keyof typeof COLORS
  className?: string
}

export default function Badge({ label, color = 'slate', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${COLORS[color]} ${className}`}>
      {label}
    </span>
  )
}
