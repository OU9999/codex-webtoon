import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';

type AppLanguage = 'ko' | 'en';

const LANGUAGE_STORAGE_KEY = 'codex-webtoon-language';
const LEGACY_LANGUAGE_STORAGE_KEY = 'webtoon-panel-studio-language';

const isAppLanguage = (value: unknown): value is AppLanguage => {
  return value === 'ko' || value === 'en';
};

const getBrowserLanguage = (): AppLanguage => {
  const language = globalThis.navigator?.language.toLowerCase() ?? '';
  if (language.startsWith('ko')) return 'ko';

  return 'en';
};

const getStoredLanguage = (): AppLanguage | null => {
  if (typeof localStorage === 'undefined') return null;

  const stored =
    localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (!isAppLanguage(stored)) return null;

  return stored;
};

const getInitialLanguage = (): AppLanguage => {
  return getStoredLanguage() ?? getBrowserLanguage();
};

const setDocumentLanguage = (language: AppLanguage): void => {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = language;
};

const setAppLanguage = async (language: AppLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
  }
  setDocumentLanguage(language);
};

const initialLanguage = getInitialLanguage();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['ko', 'en'],
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

setDocumentLanguage(initialLanguage);

export { getInitialLanguage, i18n, isAppLanguage, setAppLanguage };
export type { AppLanguage };
