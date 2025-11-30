import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '50px',
                left: '20px',
                zIndex: 1000,
                display: 'flex',
                gap: '10px',
            }}
        >
            <button
                onClick={() => i18n.changeLanguage('en')}
                style={{
                    padding: '8px 16px',
                    backgroundColor: i18n.language === 'en' ? '#db5c01' : '#1b1612',
                    color: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                }}
            >
                EN
            </button>
            <button
                onClick={() => i18n.changeLanguage('ru')}
                style={{
                    padding: '8px 16px',
                    backgroundColor: i18n.language === 'ru' ? '#db5c01' : '#1b1612',
                    color: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                }}
            >
                RU
            </button>
        </div>
    );
};

export default LanguageSwitcher;
