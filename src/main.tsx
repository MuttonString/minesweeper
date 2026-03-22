import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import en from './languages/en.json';
import zhHans from './languages/zh-Hans.json';
import zhHant from './languages/zh-Hant.json';
import ja from './languages/ja.json';

i18n.use(initReactI18next).init({
  resources: {
    en,
    'zh-Hans': zhHans,
    'zh-Hant': zhHant,
    ja,
  },
  lng: (() => {
    const lang = navigator.language;
    const html = document.querySelector('html')!;
    if (lang.startsWith('zh')) {
      if (['zh-TW', 'zh-HK'].includes(lang)) {
        html.lang = 'zh-Hant';
        return 'zh-Hant';
      } else {
        html.lang = 'zh-Hans';
        return 'zh-Hans';
      }
    } else if (lang.startsWith('ja')) {
      html.lang = 'ja';
      return 'ja';
    } else {
      html.lang = 'en';
      return 'en';
    }
  })(),
});
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
