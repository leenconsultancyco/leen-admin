const ICON_BG = {
  primary: '#E3F2FD',
  success: '#E6F6F0',
  warning: '#FFF8E6',
  danger:  '#FFEBEE',
  default: '#F0F4FF',
};

const ICON_COLOR = {
  primary: '#1A6ED8',
  success: '#0A6E51',
  warning: '#B45309',
  danger:  '#C62828',
  default: '#5A6478',
};

export default function StatCard({ icon: Icon, value, label, sublabel, color = 'default', onClick }) {
  return (
    <div
      className="leen-card"
      style={{
        background: '#fff',
        border: '1px solid #E6EAF1',
        borderRadius: 16,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {Icon && (
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: ICON_BG[color] || ICON_BG.default,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={ICON_COLOR[color] || ICON_COLOR.default} strokeWidth={1.8} />
        </div>
      )}
      <div>
        <p dir="ltr" style={{ fontSize: 18, fontWeight: 800, color: '#0B1320', lineHeight: 1.2, margin: 0 }}>
          {value}
        </p>
        <p style={{ fontSize: 11, color: '#5A6478', margin: '5px 0 0', lineHeight: 1.4 }}>
          {label}
        </p>
        {sublabel && (
          <p style={{ fontSize: 10, color: '#9AA5B4', margin: '2px 0 0' }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
