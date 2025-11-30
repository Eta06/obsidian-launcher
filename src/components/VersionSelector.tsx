import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

interface Version {
    id: string;
    type: string;
    url: string;
    time: string;
    releaseTime: string;
}

interface VersionSelectorProps {
    selectedVersion: string;
    onSelect: (version: string) => void;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({ selectedVersion, onSelect }) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
                const data = await response.json();
                // Sadece release sürümlerini al ve ilk 50 tanesini göster
                const releases = data.versions.filter((v: Version) => v.type === 'release').slice(0, 50);
                setVersions(releases);

                // Eğer seçili versiyon yoksa veya boşsa en son sürümü seç
                if (releases.length > 0 && (!selectedVersion || selectedVersion === '')) {
                    onSelect(releases[0].id);
                }

                setLoading(false);
            } catch (error) {
                console.error("Versiyonlar çekilemedi:", error);
                setLoading(false);
            }
        };

        fetchVersions();
    }, []); // Bağımlılık dizisi boş kalmalı, sadece mount anında çalışsın

    return (
        <div className="relative w-full z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center justify-between text-white hover:bg-white/10 transition-all"
            >
                <span className="font-medium">
                    {loading ? "Yükleniyor..." : `Sürüm: ${selectedVersion || 'Seçiniz'}`}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <FaChevronDown />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute w-full bottom-full mb-2 bg-obsidian-900 border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-2xl z-50"
                    >
                        {versions.map((version) => (
                            <button
                                key={version.id}
                                onClick={() => {
                                    onSelect(version.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left p-3 transition-colors ${selectedVersion === version.id
                                        ? 'bg-blue-600 text-white font-bold'
                                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {version.id}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VersionSelector;
