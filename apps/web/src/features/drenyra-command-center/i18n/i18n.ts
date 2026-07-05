import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en";
import es from "./es";

const STORAGE_KEY = "drenyra:locale";

const DETECTION_OPTIONS = {
	order: ["localStorage", "navigator", "htmlTag"],
	lookupLocalStorage: STORAGE_KEY,
	caches: ["localStorage"],
};

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: en },
			es: { translation: es },
		},
		fallbackLng: "es",
		lng: "es",
		interpolation: {
			escapeValue: false,
		},
		detection: DETECTION_OPTIONS,
	});

export function changeLanguage(lng: string) {
	localStorage.setItem(STORAGE_KEY, lng);
	void i18n.changeLanguage(lng);
}

export { useTranslation };
export default i18n;
