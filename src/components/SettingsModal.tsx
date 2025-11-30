import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMemory, FaGlobe, FaCheck } from 'react-icons/fa';
import LanguageSelector from './LanguageSelector';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: { ram: number; language: string }) => void;
    systemTotalRam: number; // Byte cinsinden
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, systemTotalRam }) => {
    const [ram, setRam] = useState(4);
    const [language, setLanguage] = useState('tr');

    // GB'a çevir
    const maxSystemRam = Math.floor(systemTotalRam / (1024 * 1024 * 1024));
    const safeRamLimit = Math.floor(maxSystemRam * 0.75); // %75 güvenli sınır

    useEffect(() => {
        if (isOpen) {
            const savedRam = localStorage.getItem('obsidian_ram');
            const savedLang = localStorage.getItem('obsidian_language');
            if (savedRam) setRam(parseInt(savedRam));
            if (savedLang) setLanguage(savedLang);
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('obsidian_ram', ram.toString());
        localStorage.setItem('obsidian_language', language);
        onSave({ ram, language });
        onClose();
    };

    // RAM Durum Metni ve Rengi
    const getRamStatus = (value: number) => {
        if (value <= 4) return { text: 'STANDARD', color: 'text-blue-400', border: 'border-blue-500/30' };
        if (value <= safeRamLimit) return { text: 'OPTIMAL', color: 'text-green-400', border: 'border-green-500/30' };
        return { text: 'UNSTABLE', color: 'text-red-500', border: 'border-red-500/30' };
    };

    const status = getRamStatus(ram);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                        initial={{ scale: 0.98, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative bg-[#0b0c10] border border-white/10 w-full max-w-[700px] rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0f1014]">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                <h2 className="text-lg font-bold text-white tracking-widest uppercase">System Configuration</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-md"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="p-8 space-y-10">

                            {/* RAM Control Section */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <FaMemory />
                                        <span className="text-xs font-bold tracking-widest uppercase">Memory Allocation</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded border ${status.border} bg-black/20`}>
                                        <span className={`text-xs font-bold tracking-widest ${status.color}`}>{status.text}</span>
                                    </div>
                                </div>

                                <div className="bg-[#15161a] p-6 rounded-lg border border-white/5 relative">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-4xl font-mono font-bold text-white">{ram}<span className="text-lg text-gray-500 ml-1">GB</span></span>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">System Total</div>
                                            <div className="text-sm font-mono text-gray-300">{maxSystemRam} GB</div>
                                        </div>
                                    </div>

                                    {/* Precision Slider */}
                                    <div className="relative h-12 flex items-center">
                                        {/* Track Background */}
                                        <div className="absolute w-full h-2 bg-[#0b0c10] rounded-full overflow-hidden border border-white/5">
                                            {/* Gradient Zones */}
                                            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-900 to-blue-600" style={{ width: `${(4 / maxSystemRam) * 100}%` }} />
                                            <div className="absolute top-0 bottom-0 bg-gradient-to-r from-green-900 to-green-500" style={{ left: `${(4 / maxSystemRam) * 100}%`, width: `${((safeRamLimit - 4) / maxSystemRam) * 100}%` }} />
                                            <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-red-900 to-red-600" style={{ width: `${((maxSystemRam - safeRamLimit) / maxSystemRam) * 100}%` }} />
                                        </div>

                                        <input
                                            type="range"
                                            min="2"
                                            max={maxSystemRam}
                                            step="1"
                                            value={ram}
                                            onChange={(e) => setRam(parseInt(e.target.value))}
                                            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                                        />

                                        {/* Thumb */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-100 pointer-events-none z-10"
                                            style={{ left: `calc(${(ram / maxSystemRam) * 100}% - 2px)` }}
                                        />

                                        {/* Tooltip above thumb */}
                                        <div
                                            className="absolute -top-2 -translate-y-full px-2 py-1 bg-white text-black text-[10px] font-bold rounded transform -translate-x-1/2 pointer-events-none transition-all duration-100"
                                            style={{ left: `${(ram / maxSystemRam) * 100}%` }}
                                        >
                                            {ram}GB
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-2 uppercase">
                                        <span>Min: 2GB</span>
                                        <span>Safe Limit: {safeRamLimit}GB</span>
                                        <span>Max: {maxSystemRam}GB</span>
                                    </div>
                                </div>
                            </div>

                            {/* Language Control Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <FaGlobe />
                                    <span className="text-xs font-bold tracking-widest uppercase">Interface Language</span>
                                </div>
                                <LanguageSelector
                                    selectedLanguage={language}
                                    onSelect={setLanguage}
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-white/5 bg-[#0f1014] flex justify-end gap-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors tracking-widest uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-2 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded transition-colors shadow-lg flex items-center gap-2 tracking-widest uppercase"
                            >
                                <FaCheck size={12} />
                                Apply Changes
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
