// metrics: [{ label, value, cls?, icon, iconBg }]
// Matches the icon mini-card style used in Payouts and Expenses pages.
export default function KpiCard({ metrics }) {
  return (
    <div className="flex flex-wrap gap-3">
      {metrics.map(({ label, value, cls, icon, iconBg }) => (
        <div key={label} className="leen-card" style={{
          background: '#fff',
          border: '1px solid #E6EAF1',
          borderRadius: 16,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: '1 1 120px',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: iconBg || '#F0F4FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#5A6478', margin: 0 }}>{label}</p>
            <p dir="ltr"
               style={{ fontSize: 20, fontWeight: 800, margin: 0, ...(cls ? {} : { color: '#0B1320' }) }}
               className={cls}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
