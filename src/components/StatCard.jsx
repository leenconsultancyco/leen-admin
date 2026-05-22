import { Card } from '@heroui/react';

const COLOR_BG = {
  primary: 'bg-primary-100  text-primary',
  success: 'bg-success-100  text-success',
  warning: 'bg-warning-100  text-warning',
  danger:  'bg-danger-100   text-danger',
  default: 'bg-default-100  text-default-600',
};

const TREND_COLOR = {
  up:   'text-success',
  down: 'text-danger',
};

export default function StatCard({ icon, value, label, color = 'default', trend, onClick }) {
  return (
    <Card
      className={['leen-card', onClick ? 'cursor-pointer' : ''].join(' ')}
      isPressable={!!onClick}
      onPress={onClick}
    >
      <Card.Content className="flex flex-row items-center gap-4 p-4">
        <div className={`rounded-xl p-3 text-2xl leading-none shrink-0 ${COLOR_BG[color] || COLOR_BG.default}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-default-800 truncate">{value}</p>
          <p className="text-sm text-default-400 truncate">{label}</p>
          {trend && (
            <p className={`text-xs mt-0.5 ${TREND_COLOR[trend.direction] || ''}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
