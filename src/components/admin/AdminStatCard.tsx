interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function AdminStatCard({
  label,
  value,
  icon,
  sub,
  color = 'blue',
}: AdminStatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 ${COLOR_MAP[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
