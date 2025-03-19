import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';

// Define available languages
export type Language = 'ja' | 'en' | 'ko';

// Define translations for UI elements
type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  ja: {
    trending: "トレンド",
    new: "新着",
    favorites: "お気に入り",
    home: "ホーム",
    search: "検索",
    profile: "プロフィール",
    premium: "プレミアム",
    unlock: "プレミアムを解除",
    getStarted: "始める",
    login: "ログイン",
    alreadyHaveAccount: "アカウントをお持ちの方はログイン",
    watchNow: "今すぐ見る",
    skipLogin: "ログインをスキップ",
    featuredVideos: "おすすめ動画",
  },
  en: {
    trending: "Trending",
    new: "New",
    favorites: "Favorites",
    home: "Home",
    search: "Search",
    profile: "Profile",
    premium: "PREMIUM",
    unlock: "Unlock Premium",
    getStarted: "Get Started",
    login: "Log in",
    alreadyHaveAccount: "Already have an account? Log in",
    watchNow: "Watch Now",
    skipLogin: "Skip Login",
    featuredVideos: "Featured Videos",
  },
  ko: {
    trending: "인기",
    new: "신규",
    favorites: "즐겨찾기",
    home: "홈",
    search: "검색",
    profile: "프로필",
    premium: "프리미엄",
    unlock: "프리미엄 해제",
    getStarted: "시작하기",
    login: "로그인",
    alreadyHaveAccount: "이미 계정이 있으신가요? 로그인",
    watchNow: "지금 보기",
    skipLogin: "로그인 건너뛰기",
    featuredVideos: "추천 비디오",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ja',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ja');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['ja', 'en', 'ko'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);