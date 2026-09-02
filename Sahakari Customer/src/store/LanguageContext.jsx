import React, { createContext, useState, useCallback, useMemo } from 'react';
import { locales, LANGUAGES } from '../locales';

export const LanguageContext = createContext(null);

/**
 * Resolve a dot-notation key (e.g. "hero.stats.avgRating") against a locale object.
 * Falls back to the key itself if not found.
 */
function resolve(obj, key) {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return key;
    current = current[part];
  }
  return current ?? key;
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('sahakari_lang');
      if (saved && locales[saved]) return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLang = useCallback((code) => {
    if (!locales[code]) return;
    setLangState(code);
    try {
      localStorage.setItem('sahakari_lang', code);
    } catch {
      // ignore
    }
  }, []);

  /** Translate a dot-notation key to the current locale string. */
  const t = useCallback(
    (key) => resolve(locales[lang], key),
    [lang]
  );

  const currentLanguage = useMemo(
    () => LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0],
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, currentLanguage, languages: LANGUAGES }),
    [lang, setLang, t, currentLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
