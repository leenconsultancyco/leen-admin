import { Card } from '@heroui/react';

const ICON_BG = {
  primary: 'bg-primary-50  text-primary',
  success: 'bg-success-50  text-success',
  warning: 'bg-warning-50  text-warning',
  danger:  'bg-danger-50   text-danger',
  default: 'bg-default-100 text-default-400',
};

export default function StatCard({ icon: Icon, value, label, sublabel, color = 'default', trend, onClick }) {
  return (
    <Card
      className={['leen-card', onClick ? 'cursor-pointer' : ''].join(' ')}
      isPressable={!!onClick}
      onPress={onClick}
    >
      <Card.Content className="flex flex-row items-center gap-3 p-3 md:p-[14px]">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[color] || ICON_BG.default}`}>
            <Icon size={21} strokeWidth={1.5} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base md:text-lg font-bold text-default-800 leading-tight truncate">{value}</p>
          <p className="text-[11px] text-default-500 mt-0.5 truncate">{label}</p>
          {trend ? (
            <p className={`text-xs font-semibold mt-0.5 ${trend.direction === 'up' ? 'text-success' : 'text-danger'}`}>
              {trend.direction === 'up' ? '▲' : '▼'} {Math.abs(trend.value)}%
            </p>
          ) : sublabel ? (
            <p className="text-[10px] text-default-400 mt-0.5 truncate">{sublabel}</p>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  );
}
