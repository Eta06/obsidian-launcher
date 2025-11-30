import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaMicrosoft, FaUserSecret, FaCog, FaDiscord, FaUser } from 'react-icons/fa';

import VersionSelector from './components/VersionSelector';
import SettingsModal from './components/SettingsModal';

// Electron güvenli import (Tarayıcıda patlamasın diye kontrol)
const electron = (window as any).require ? (window as any).require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

function App() {
  // State Tanımları
  const [username, setUsername] = useState(''); // Cracked için isim
  const [authType, setAuthType] = useState<'offline' | 'microsoft'>('offline');
  const [msProfile, setMsProfile] = useState<any>(null); // Microsoft profil verisi
  const [status, setStatus] = useState<'idle' | 'downloading' | 'playing'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Hazır');
  const [selectedVersion, setSelectedVersion] = useState(''); // Varsayılan versiyon (Otomatik seçilecek)

  // Ayarlar State'i
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ram, setRam] = useState(4);
  const [language, setLanguage] = useState('tr');
  const [systemTotalRam, setSystemTotalRam] = useState(8 * 1024 * 1024 * 1024); // Varsayılan 8GB (Byte cinsinden)

  // Başlangıçta ayarları ve sistem bilgisini yükle
  useEffect(() => {
    const savedRam = localStorage.getItem('obsidian_ram');
    const savedLang = localStorage.getItem('obsidian_language');
    if (savedRam) setRam(parseInt(savedRam));
    if (savedLang) setLanguage(savedLang);

    // Sistem RAM bilgisini çek
    if (ipcRenderer) {
      ipcRenderer.invoke('get-system-ram').then((totalRam: number) => {
        console.log("Sistem RAM:", totalRam);
        setSystemTotalRam(totalRam);
      });
    }
  }, []);

  // Electron Listenerları
  useEffect(() => {
    if (!ipcRenderer) return;

    // İlerleme Dinleyici
    ipcRenderer.on('progress', (_event: any, data: any) => {
      setStatus('downloading');
      const percent = Math.round((data.task / data.total) * 100);
      setProgress(percent);
      setStatusText(`İndiriliyor: %${percent} - ${data.type}`);
    });

    // Oyun Açıldı Dinleyici
    ipcRenderer.on('game-launched', () => {
      setStatus('playing');
      setStatusText('Oyun Başarıyla Başlatıldı!');

      // 3 saniye sonra arayüzü resetle (isteğe bağlı)
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setStatusText('Hazır');
      }, 5000);
    });

    // Cleanup
    return () => {
      ipcRenderer.removeAllListeners('progress');
      ipcRenderer.removeAllListeners('game-launched');
    };
  }, []);

  // Microsoft Login İşlemi
  const handleMicrosoftLogin = async () => {
    if (!ipcRenderer) return;
    setStatusText("Microsoft sunucularına bağlanılıyor...");

    // Backend'e sor
    const result = await ipcRenderer.invoke('login-microsoft');

    if (result.success) {
      console.log("Frontend received profile:", result.profile);
      setMsProfile(result.profile);
      setAuthType('microsoft');

      // Güvenli erişim (JSON yapısına göre: result.profile -> profile -> name)
      const name = result.profile?.profile?.name || result.profile?.name || "Oyuncu";
      setStatusText(`Hoşgeldin, ${name}`);

      // 2 saniye sonra hazır mesajına dön
      setTimeout(() => setStatusText('Hazır'), 2000);
    } else {
      alert("Giriş başarısız oldu.");
      setStatusText("Giriş İptal Edildi");
    }
  };

  // Oyunu Başlatma İşlemi
  const handleLaunch = () => {
    if (!ipcRenderer) return;

    // Offline modda isim kontrolü
    if (authType === 'offline' && !username) {
      alert("Lütfen kullanıcı adı girin!");
      return;
    }

    // Microsoft modunda giriş kontrolü
    if (authType === 'microsoft' && !msProfile) {
      alert("Lütfen önce Microsoft ile giriş yapın!");
      return;
    }

    setStatus('downloading');
    setStatusText('Dosyalar İndiriliyor...');
    setProgress(0);

    ipcRenderer.send('launch-game', {
      type: authType,
      username: username, // Offline ise bu
      authObject: msProfile, // Microsoft ise bu
      ram: `${ram}G`, // Dinamik RAM
      version: selectedVersion // Seçilen versiyonu gönder
    });
  };

  return (
    <div className="h-screen w-screen flex bg-obsidian-900 text-white font-sans overflow-hidden select-none">

      {/* Ayarlar Modalı */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => {
          setRam(settings.ram);
          setLanguage(settings.language);
        }}
        systemTotalRam={systemTotalRam}
      />

      {/* SOL SIDEBAR */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-20 bg-obsidian-800 flex flex-col items-center py-8 gap-8 border-r border-white/5 z-20"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-obsidian-500 to-blue-600 rounded-lg shadow-[0_0_15px_rgba(102,252,241,0.5)]" />

        <div className="flex-1 flex flex-col gap-6 w-full items-center text-gray-400">
          <button className="p-3 hover:text-white hover:bg-white/5 rounded-xl transition-all"><FaUser size={20} /></button>
          <button className="p-3 hover:text-white hover:bg-white/5 rounded-xl transition-all"><FaDiscord size={20} /></button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="mt-auto p-3 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <FaCog size={20} />
          </button>
        </div>
      </motion.div>

      {/* ANA İÇERİK */}
      <div className="flex-1 relative flex flex-col">
        {/* Pencere Sürükleme Alanı */}
        <div className="h-8 w-full bg-transparent z-50 absolute top-0 left-0" style={{ WebkitAppRegion: 'drag' } as any} />

        {/* Arkaplan Görseli */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img src="https://images.wallpapersden.com/image/download/minecraft-rtx-on_bG1lZm6UmZqaraWkpJRmbmdlrWZlbWU.jpg"
            className="w-full h-full object-cover grayscale-[30%]" alt="bg" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/80 to-transparent" />
        </div>

        {/* İçerik Container */}
        <div className="relative z-10 flex-1 flex flex-col justify-end p-12 pb-16">

          {/* Başlık */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-2">
              OBSIDIAN
            </h1>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-white/10 rounded text-xs font-bold tracking-widest text-obsidian-500 border border-obsidian-500/30">
                {selectedVersion || 'LOADING'} - RELEASE
              </span>
            </div>
          </motion.div>

          {/* Login Tipi Seçici */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setAuthType('offline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${authType === 'offline' ? 'bg-white/10 text-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <FaUserSecret /> Korsan (Offline)
            </button>
            <button
              onClick={() => setAuthType('microsoft')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${authType === 'microsoft' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <FaMicrosoft /> Microsoft
            </button>
          </div>

          {/* Kontrol Paneli */}
          <div className="flex items-end gap-6">

            {/* Dinamik Input Alanı */}
            <div className="flex flex-col gap-4 w-full max-w-[300px]">

              {/* Versiyon Seçici */}
              <div className="w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">
                  Oyun Sürümü
                </label>
                <VersionSelector
                  selectedVersion={selectedVersion}
                  onSelect={setSelectedVersion}
                />
              </div>

              {/* Kullanıcı Girişi */}
              <div className="w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">
                  {authType === 'offline' ? 'Kullanıcı Adı' : 'Microsoft Hesabı'}
                </label>

                {authType === 'offline' ? (
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="İsmini Yaz..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all backdrop-blur-sm"
                    />
                  </div>
                ) : (
                  <div className="bg-black/40 border border-blue-500/30 rounded-xl px-4 py-2 flex items-center justify-between backdrop-blur-sm h-[50px]">
                    {msProfile ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://crafatar.com/avatars/${msProfile?.profile?.id || msProfile?.id || 'steve'}?size=30&overlay`}
                          className="rounded"
                          alt="skin"
                        />
                        <span className="font-bold text-blue-400">
                          {msProfile?.profile?.name || msProfile?.name || "Oyuncu"}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleMicrosoftLogin}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full h-full"
                      >
                        <FaMicrosoft />
                        <span>Giriş Yap</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Oyna Butonu / Progress Bar */}
            <div className="flex-1 h-14 relative flex items-center">
              <AnimatePresence mode='wait'>
                {status === 'idle' || status === 'playing' ? (
                  <motion.button
                    key="play-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLaunch}
                    disabled={authType === 'microsoft' && !msProfile}
                    className={`h-full px-12 font-black text-xl rounded-lg shadow-[0_0_20px_rgba(102,252,241,0.3)] flex items-center gap-3 transition-colors 
                                ${authType === 'microsoft' && !msProfile
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-obsidian-500 hover:bg-obsidian-400 text-obsidian-900'}`}
                  >
                    <FaPlay size={18} /> {status === 'playing' ? 'ÇALIŞIYOR' : 'OYNA'}
                  </motion.button>
                ) : (
                  <motion.div
                    key="progress-bar"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '100%' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="h-full w-full bg-black/40 rounded-lg border border-white/10 relative overflow-hidden flex items-center px-6 backdrop-blur-md"
                  >
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 bg-obsidian-500/20"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'spring', stiffness: 50 }}
                    />

                    <div className="relative z-10 flex justify-between w-full font-mono text-sm">
                      <span className="text-obsidian-500 font-bold animate-pulse">{statusText}</span>
                      <span className="text-white">%{progress}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;