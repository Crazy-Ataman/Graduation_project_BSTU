import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const handleChangeLanguage = async (language = "en") => {
    await i18n.changeLanguage(language);
};

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'ru'],
        debug: true,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'subdomain'],
            caches: ['cookie', 'localStorage', 'sessionStorage'],
        }
    });

export default i18n;
