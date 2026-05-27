import { useState, useEffect, useMemo } from 'react';
import { Button, Spinner } from '@heroui/react';
import { getAvailableSlots, addBookingAdmin } from '../api';
import { useI18n } from '../i18n';

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DAYS_EN   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_AR   = ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت'];
const TYPES     = ['Individual','Couples','Family','Group','Workshop'];
const MODES     = ['In-person','Online'];

function to12h(t) {
  if (!t) return t;
  const [h, m] = String(t).split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function buildCalendarDays(year, month) {
  const startDow   = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const INPUT_S = {
  border: '1.5px solid #d1d5db', borderRadius: '6px', padding: '6px 8px',
  fontSize: '12px', width: '100%', boxSizing: 'border-box', outline: 'none',
};

export default function SessionCalendarView({ sessions, therapistId, therapists, month, year, onBookingSuccess }) {
  const { t, lang } = useI18n();
  const [selectedDay, setSelectedDay]   = useState(null);
  const [slots, setSlots]               = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [clientName, setClientName]     = useState('');
  const [sessionType, setSessionType]   = useState('Individual');
  const [sessionMode, setSessionMode]   = useState('In-person');
  const [saving, setSaving]             = useState(false);

  const todayStr    = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const calDays     = useMemo(() => buildCalendarDays(year, month), [year, month]);
  const dayHeaders  = lang === 'ar' ? DAYS_AR : DAYS_EN;
  const monthLabel  = (lang === 'ar' ? MONTHS_AR : MONTHS_EN)[month - 1];

  // Index sessions by date
  const sessionsByDate = useMemo(() => {
    const map = {};
    (Array.isArray(sessions) ? sessions : []).forEach((s) => {
      const d = String(s.Session_Date || '').substring(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return map;
  }, [sessions]);

  // Fetch slots when day or therapist changes
  useEffect(() => {
    if (!selectedDay || !therapistId) { setSlots([]); return; }
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
    let cancelled = false;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot('');
    getAvailableSlots(therapistId, dateStr).then((r) => {
      if (cancelled) return;
      setSlots(r.success && Array.isArray(r.data) ? r.data : []);
      setSlotsLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedDay, therapistId, month, year]);

  function handleDayClick(day) {
    const dow = new Date(year, month - 1, day).getDay();
    if (dow === 5 || dow === 6) return; // Fri + Sat weekend
    setSelectedDay(day);
    setClientName('');
    setSessionType('Individual');
    setSessionMode('In-person');
    setSelectedSlot('');
  }

  const selectedDateStr = selectedDay
    ? `${year}-${String(month).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null;

  const bookedTimesForDay = useMemo(() => {
    if (!selectedDateStr) return new Set();
    return new Set(
      (sessionsByDate[selectedDateStr] || [])
        .filter((s) => s.Status !== 'Cancelled' && (!therapistId || s.Therapist_ID === therapistId))
        .map((s) => s.Session_Time)
    );
  }, [selectedDateStr, sessionsByDate, therapistId]);

  const daySessionsForPanel = useMemo(() => {
    if (!selectedDateStr) return [];
    return (sessionsByDate[selectedDateStr] || []).filter((s) => s.Status !== 'Cancelled');
  }, [selectedDateStr, sessionsByDate]);

  const therapistTypes = useMemo(() => {
    if (!therapistId) return TYPES;
    const th = therapists.find((t) => t.Therapist_ID === therapistId);
    if (!th?.Session_Types) return TYPES;
    const parsed = String(th.Session_Types).split(',').map((t) => t.trim()).filter(Boolean);
    return parsed.length ? parsed : TYPES;
  }, [therapistId, therapists]);

  async function handleConfirm() {
    if (!clientName || !selectedSlot || !selectedDateStr || !therapistId) return;
    setSaving(true);
    await addBookingAdmin({
      Therapist_ID: therapistId,
      Session_Date: selectedDateStr,
      Session_Time: selectedSlot,
      Session_Type: sessionType,
      Session_Mode: sessionMode,
      Client_Name: clientName,
      Client_Phone: '',
      Status: 'Confirmed',
      Payment_Status: 'Unpaid',
      Payment_Method: 'Cash',
      Notes: '',
    });
    setSaving(false);
    onBookingSuccess();
  }

  return (
    <div style={{ display: 'flex', gap: '12px', minHeight: '480px' }}>
      {/* ── Calendar grid ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
          {monthLabel} {year}
        </p>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '3px' }}>
          {dayHeaders.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '3px 0',
              color: (i === 5 || i === 6) ? '#d1d5db' : '#9ca3af',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
          {calDays.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;
            const dateStr   = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dow       = new Date(year, month - 1, day).getDay();
            const isWeekend = dow === 5 || dow === 6;
            const isToday   = dateStr === todayStr;
            const isSel     = selectedDay === day;
            const active    = (sessionsByDate[dateStr] || []).filter((s) => s.Status !== 'Cancelled');

            return (
              <div
                key={day}
                onClick={() => !isWeekend && handleDayClick(day)}
                style={{
                  minHeight: '68px', padding: '4px', borderRadius: '6px',
                  border: isSel ? '2px solid #0E9B73' : '1px solid #e5e7eb',
                  borderBottom: isToday && !isSel ? '3px solid #0E9B73' : undefined,
                  backgroundColor: isWeekend ? '#fafafa' : isSel ? '#f0fdf4' : '#fff',
                  cursor: isWeekend ? 'default' : 'pointer',
                  opacity: isWeekend ? 0.45 : 1,
                  transition: 'border-color 0.1s, background 0.1s',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  fontSize: '11px', fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#0E9B73' : '#374151', marginBottom: '2px',
                }}>
                  {day}
                </div>
                {active.slice(0, 2).map((s, i) => (
                  <div key={i} style={{
                    fontSize: '10px', backgroundColor: '#0E9B73', color: '#fff',
                    borderRadius: '3px', padding: '1px 3px', marginBottom: '1px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {String(s.Session_Time || '').slice(0, 5)} {s.Client_Name}
                  </div>
                ))}
                {active.length > 2 && (
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>+{active.length - 2}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Day panel ── */}
      {selectedDay && (
        <div style={{
          width: '220px', flexShrink: 0, borderLeft: '1px solid #e5e7eb',
          paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <p style={{ fontWeight: 600, fontSize: '13px', color: '#374151', margin: 0 }}>
            {selectedDateStr}
          </p>

          {!therapistId ? (
            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              {t('sessions.selectTherapistFirst')}
            </p>
          ) : (
            <>
              {/* Available slots */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '5px' }}>
                  Available Slots
                </p>
                {slotsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af', fontSize: '11px' }}>
                    <Spinner size="sm" /> Loading…
                  </div>
                ) : slots.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>No slots available</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {slots.map((slot) => {
                      const booked = bookedTimesForDay.has(slot);
                      const sel    = selectedSlot === slot;
                      return (
                        <button key={slot} type="button" disabled={booked} onClick={() => !booked && setSelectedSlot(slot)} style={{
                          padding: '2px 7px', borderRadius: '5px', fontSize: '11px',
                          border: `1.5px solid ${sel ? '#0E9B73' : booked ? '#e5e7eb' : '#d1d5db'}`,
                          backgroundColor: sel ? '#0E9B73' : booked ? '#f9fafb' : '#fff',
                          color: sel ? '#fff' : booked ? '#c4c4c4' : '#374151',
                          textDecoration: booked ? 'line-through' : 'none',
                          cursor: booked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.1s',
                        }}>
                          {to12h(slot)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Already booked */}
              {daySessionsForPanel.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>
                    Already Booked
                  </p>
                  {daySessionsForPanel.map((s, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#374151', marginBottom: '2px' }}>
                      {String(s.Session_Time || '').slice(0, 5) || '—'} · {s.Client_Name}
                    </div>
                  ))}
                </div>
              )}

              {/* Mini booking form */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  placeholder="Client name *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={INPUT_S}
                />
                <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} style={INPUT_S}>
                  {therapistTypes.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <select value={sessionMode} onChange={(e) => setSessionMode(e.target.value)} style={INPUT_S}>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <Button
                  size="sm"
                  color="primary"
                  isDisabled={!clientName || !selectedSlot || saving}
                  onPress={handleConfirm}
                  startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
                >
                  {saving ? 'Saving…' : 'Confirm Booking'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
