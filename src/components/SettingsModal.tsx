import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMemory, FaGlobe, FaCheck, FaFilter } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemTotalRam: number; // Byte cinsinden
    showSnapshots: boolean;
    showOldBeta: boolean;
    showOldAlpha: boolean;
    onSave: (settings: {
        ram: number;
        language: string;
        showSnapshots: boolean;
        showOldBeta: boolean;
        showOldAlpha: boolean;
    }) => void;
}

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
    <div
        onClick={() => onChange(!checked)}
        className="flex items-center justify-between p-4 bg-[#15161a] rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all group"
    >
        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{label}</span>
        {/* w-11 (44px) h-6 (24px) */}
        <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}>
            <motion.div
                initial={false}
                animate={{ x: checked ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </div>
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    onSave,
    systemTotalRam,
    showSnapshots: initialShowSnapshots,
    showOldBeta: initialShowOldBeta,
    showOldAlpha: initialShowOldAlpha
}) => {
    const { t } = useTranslation();
    const [ram, setRam] = useState(4);
    const [language, setLanguage] = useState('tr');
    const [showSnapshots, setShowSnapshots] = useState(false);
    const [showOldBeta, setShowOldBeta] = useState(false);
    const [showOldAlpha, setShowOldAlpha] = useState(false);

    // GB'a çevir
    const maxSystemRam = Math.floor(systemTotalRam / (1024 * 1024 * 1024));
    const safeRamLimit = Math.floor(maxSystemRam * 0.75); // %75 güvenli sınır

    useEffect(() => {
        if (isOpen) {
            const savedRam = localStorage.getItem('obsidian_ram');
            const savedLang = localStorage.getItem('obsidian_language');
            if (savedRam) setRam(parseInt(savedRam));
            if (savedLang) setLanguage(savedLang);
            setShowSnapshots(initialShowSnapshots);
            setShowOldBeta(initialShowOldBeta);
            setShowOldAlpha(initialShowOldAlpha);
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('obsidian_ram', ram.toString());
        localStorage.setItem('obsidian_language', language);
        localStorage.setItem('obsidian_showSnapshots', showSnapshots.toString());
        localStorage.setItem('obsidian_showOldBeta', showOldBeta.toString());
        localStorage.setItem('obsidian_showOldAlpha', showOldAlpha.toString());

        onSave({
            ram,
            language,
            showSnapshots,
            showOldBeta,
            showOldAlpha
        });
        onClose();
    };

    // RAM Durum Metni ve Rengi
    const getRamStatus = (value: number) => {
        if (value <= 4) return { text: t('settings.status.standard'), color: 'text-blue-400', border: 'border-blue-500/30' };
        if (value <= safeRamLimit) return { text: t('settings.status.optimal'), color: 'text-green-400', border: 'border-green-500/30' };
        return { text: t('settings.status.unstable'), color: 'text-red-500', border: 'border-red-500/30' };
    };

    const status = getRamStatus(ram);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Professional Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative bg-[#0b0c10] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-[#0f1014] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                <h2 className="text-xl font-bold text-white tracking-wide">{t('settings.title')}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: General & RAM */}
                                <div className="space-y-8">
                                    {/* Language Control */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                                            <FaGlobe className="text-blue-500" />
                                            <span className="text-xs font-bold tracking-widest uppercase">{t('settings.interfaceLanguage')}</span>
                                        </div>
                                        <LanguageSelector
                                            selectedLanguage={language}
                                            onSelect={setLanguage}
                                        />
                                    </div>

                                    {/* RAM Control - YENİ TASARIM (ÇUBUKLU) */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <FaMemory className="text-purple-500" />
                                                <span className="text-xs font-bold tracking-widest uppercase">{t('settings.memoryAllocation')}</span>
                                            </div>
                                            <div className={`px-3 py-1 rounded border ${status.border} bg-black/20`}>
                                                <span className={`text-xs font-bold tracking-widest ${status.color}`}>{status.text}</span>
                                            </div>
                                        </div>

                                        <div className="bg-[#15161a] p-6 rounded-xl border border-white/5 relative group hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-center mb-8">
                                                <span className="text-5xl font-mono font-bold text-white tracking-tighter">{ram}<span className="text-lg text-gray-500 ml-1">GB</span></span>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('settings.systemTotal')}</div>
                                                    <div className="text-sm font-mono text-gray-300">{maxSystemRam} GB</div>
                                                </div>
                                            </div>

                                            {/* Slider Track Area */}
                                            <div className="relative h-12 flex items-center select-none">
                                                {/* Track Background */}
                                                <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-[#0b0c10] rounded-full overflow-hidden border border-white/5">
                                                    {/* Gradient Zones */}
                                                    <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-900 to-blue-600" style={{ width: `${(4 / maxSystemRam) * 100}%` }} />
                                                    <div className="absolute top-0 bottom-0 bg-gradient-to-r from-green-900 to-green-500" style={{ left: `${(4 / maxSystemRam) * 100}%`, width: `${((safeRamLimit - 4) / maxSystemRam) * 100}%` }} />
                                                    <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-red-900 to-red-600" style={{ width: `${((maxSystemRam - safeRamLimit) / maxSystemRam) * 100}%` }} />
                                                </div>

                                                {/* Input (Invisible functionality) */}
                                                <input
                                                    type="range"
                                                    min="2"
                                                    max={maxSystemRam}
                                                    step="1"
                                                    value={ram}
                                                    onChange={(e) => setRam(parseInt(e.target.value))}
                                                    className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                                                />

                                                {/* YENİ TASARIM: ÇUBUK THUMB */}
                                                {/* layoutId sildim, bu sayede titreme yapmaz. */}
                                                <div
                                                    className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-75 ease-out"
                                                    style={{
                                                        left: `calc(${(ram / maxSystemRam) * 100}% - 2px)` // 2px: çubuk genişliğinin yarısı
                                                    }}
                                                >
                                                    {/* Çubuk Gövdesi */}
                                                    <div className="w-1 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] relative">
                                                        {/* Üst ve Altına ufak parlama efektleri ekleyelim ki teknolojik dursun */}
                                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-4 uppercase tracking-wider">
                                                <span>Min: 2GB</span>
                                                <span>{t('settings.safeLimit')}: {safeRamLimit}GB</span>
                                                <span>Max: {maxSystemRam}GB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Version Filters */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 text-gray-400 mb-2">
                                        <FaFilter className="text-orange-500" />
                                        <span className="text-xs font-bold tracking-widest uppercase">{t('settings.versionFilters')}</span>
                                    </div>

                                    <div className="bg-[#15161a]/50 p-1 rounded-2xl border border-white/5 space-y-1">
                                        <Toggle
                                            label="Show Snapshots"
                                            checked={showSnapshots}
                                            onChange={setShowSnapshots}
                                        />
                                        <Toggle
                                            label="Show Old Beta"
                                            checked={showOldBeta}
                                            onChange={setShowOldBeta}
                                        />
                                        <Toggle
                                            label="Show Old Alpha"
                                            checked={showOldAlpha}
                                            onChange={setShowOldAlpha}
                                        />
                                    </div>

                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <p className="text-xs text-blue-300 leading-relaxed">
                                            Enabling these options will allow you to see and play development versions of Minecraft.
                                            These versions may be unstable and could corrupt your worlds.
                                            <span className="font-bold block mt-1">Please back up your data!</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 border-t border-white/5 bg-[#0f1014] flex justify-end gap-4 shrink-0">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-xs font-bold text-gray-500 hover:text-white transition-colors tracking-widest uppercase hover:bg-white/5 rounded-lg"
                            >
                                {t('settings.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded-lg transition-all shadow-lg hover:shadow-white/20 flex items-center gap-2 tracking-widest uppercase transform active:scale-95"
                            >
                                <FaCheck size={12} />
                                {t('settings.applyChanges')}
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
