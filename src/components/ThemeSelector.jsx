import { useState } from 'react';
import { Tooltip } from '@heroui/react';
import { applyTheme, THEMES, THEME_LABELS } from '../utils';
import { useI18n } from '../i18n';

const THEME_COLORS = {
  teal:   '#0E9B73',
  navy:   '#1B2A6B',
  blue:   '#1A6ED8',
  green:  '#2E7D32',
  red:    '#C62828',
  purple: '#6A1B9A',
};

export default function ThemeSelector() {
  const { lang } = useI18n();
  const [current, setCurrent] = useState(
    () => localStorage.getItem('leen_theme') || 'teal'
  );

  function select(theme) {
    applyTheme(theme);
    setCurrent(theme);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {THEMES.map((theme) => (
        <Tooltip key={theme}>
          <Tooltip.Trigger>
            <button
              type="button"
              onClick={() => select(theme)}
              style={{ backgroundColor: THEME_COLORS[theme] }}
              className={[
                'w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none',
                current === theme ? 'ring-2 ring-offset-2 ring-default-400 scale-110' : '',
              ].join(' ')}
              aria-label={THEME_LABELS[theme][lang]}
            />
          </Tooltip.Trigger>
          <Tooltip.Content>{THEME_LABELS[theme][lang] || theme}</Tooltip.Content>
        </Tooltip>
      ))}
    </div>
  );
}
