import { Card } from '@heroui/react';

const ICON_COLOR = {
  primary: 'bg-primary-50  text-primary',
  success: 'bg-success-50  text-success',
  warning: 'bg-warning-50  text-warning',
  danger:  'bg-danger-50   text-danger',
  default: 'bg-default-100 text-default-500',
};

const TREND_COLOR = {
  up:   'text-success',
  down: 'text-danger',
};

export default function StatCard({ icon: Icon, value, label, sublabel, color = 'default', trend, onClick }) {
  return (
    <Card
      className={['leen-card', onClick ? 'cursor-pointer' : ''].join(' ')}
      isPressable={!!onClick}
      onPress={onClick}
    >
      <Card.Content className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-3 md:p-4">
        {Icon && (
          <div className={`rounded-xl p-2.5 shrink-0 ${ICON_COLOR[color] || ICON_COLOR.default}`}>
            <Icon size={20} strokeWidth={1.6} />
          </div>
        )}
        <div className="flex-1 min-w-0 w-full">
          <p className="text-base md:text-2xl font-bold text-default-800 truncate">{value}</p>
          <p className="text-xs md:text-sm text-default-400 truncate">{label}</p>
          {sublabel && <p className="text-xs text-default-300 truncate">{sublabel}</p>}
          {trend && (
            <p className={`text-xs mt-0.5 font-medium ${TREND_COLOR[trend.direction] || ''}`}>
              {trend.direction === 'up' ? '▲' : '▼'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
