import { Button } from '@heroui/react';
import { useI18n } from '../i18n';

export default function LanguageToggle() {
  const { lang, toggleLang } = useI18n();

  return (
    <Button size="sm" variant="light" onPress={toggleLang} className="font-medium min-w-0 px-2">
      {lang === 'ar' ? 'EN' : 'عر'}
    </Button>
  );
}
