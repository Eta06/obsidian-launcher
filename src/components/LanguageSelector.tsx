import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

interface Language {
    code: string;
    name: string;
    flag: string;
}

const languages: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

interface LanguageSelectorProps {
    selectedLanguage: string;
    onSelect: (langCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = languages.find(l => l.code === selectedLanguage) || languages[0];

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#15161a] border border-white/5 rounded-lg px-4 py-3 flex items-center justify-between hover:border-white/10 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all">{currentLang.flag}</span>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{currentLang.name}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <FaChevronDown className="text-gray-600 group-hover:text-gray-400 transition-colors text-xs" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute w-full mt-2 bg-[#1a1b20] border border-white/10 rounded-lg overflow-hidden shadow-2xl z-50"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    onSelect(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-l-2 ${selectedLanguage === lang.code
                                        ? 'bg-white/5 border-blue-500 text-white'
                                        : 'border-transparent text-gray-400'
                                    }`}
                            >
                                <span className={`text-xl ${selectedLanguage === lang.code ? '' : 'filter grayscale opacity-70'}`}>{lang.flag}</span>
                                <span className="text-sm font-medium">{lang.name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSelector;
