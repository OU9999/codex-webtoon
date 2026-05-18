import { useTranslation } from 'react-i18next';

import { isAppLanguage, setAppLanguage } from '@/i18n/i18n';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import type { AppLanguage } from '@/i18n/i18n';

interface LanguageOption {
  code: AppLanguage;
  shortLabel: string;
}

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'ko', shortLabel: 'KO' },
  { code: 'en', shortLabel: 'EN' },
];

const getCurrentLanguage = (language: string): AppLanguage => {
  if (language.toLowerCase().startsWith('ko')) return 'ko';

  return 'en';
};

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = getCurrentLanguage(i18n.language);
  const currentOption =
    LANGUAGE_OPTIONS.find((option) => option.code === currentLanguage) ??
    LANGUAGE_OPTIONS[0];

  const handleLanguageSelect = (language: string): void => {
    if (!isAppLanguage(language)) return;
    if (language === currentLanguage) return;

    void setAppLanguage(language);
  };

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageSelect}>
      <SelectTrigger
        aria-label={t('language.label')}
        className="h-[30px] w-[58px] justify-center gap-1 px-1.5"
      >
        <span className="min-w-5 text-center text-[10px] text-foreground">
          {currentOption.shortLabel}
        </span>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[58px]">
        <SelectGroup>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem
              key={option.code}
              value={option.code}
              className="justify-center pr-6 pl-2 text-center"
            >
              <span className="min-w-5 text-center font-mono text-[10px] font-black">
                {option.shortLabel}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export { LanguageSwitcher };
