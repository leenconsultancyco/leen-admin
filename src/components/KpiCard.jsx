import { Card } from '@heroui/react';

// metrics: [{ label, value, cls? }]
// cls overrides the value text color (e.g. 'text-success', 'text-danger')
export default function KpiCard({ metrics }) {
  return (
    <div className="flex justify-center">
      <Card className="leen-card w-full max-w-2xl">
        <Card.Content>
          <div className="flex flex-wrap justify-around gap-x-8 gap-y-3 text-center py-1">
            {metrics.map(({ label, value, cls }) => (
              <div key={label} className="flex flex-col gap-0.5 min-w-[100px]">
                <span className="text-xs text-default-400">{label}</span>
                <span className={`text-base font-semibold ${cls || 'text-default-800'}`} dir="ltr">{value}</span>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
