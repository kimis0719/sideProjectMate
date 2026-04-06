interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

const COLOR_MAP = {
  blue: 'bg-primary/5 text-primary',
  green: 'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  purple: 'bg-secondary-container text-on-secondary-container',
};

export default function AdminStatCard({
  label,
  value,
  icon,
  sub,
  color = 'blue',
}: AdminStatCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-6 hover:bg-surface-bright hover:shadow-ambient transition-all duration-200">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 ${COLOR_MAP[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0 mt-4">
        <p className="font-body text-label-md text-on-surface-variant font-medium mb-0.5">
          {label}
        </p>
        <p className="font-headline text-[2rem] font-bold text-on-surface leading-tight">{value}</p>
        {sub && <p className="font-body text-label-md text-on-surface-variant mt-1">{sub}</p>}
      </div>
    </div>
  );
}
