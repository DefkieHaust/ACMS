import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'english' },
  { code: 'es', label: 'ES', name: 'spanish' },
  { code: 'fr', label: 'FR', name: 'french' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      {LANGUAGES.map((lang) => {
        const active = i18n.language === lang.code || i18n.language.startsWith(lang.code);
        return (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
              active
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
            }`}
            title={lang.name}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
