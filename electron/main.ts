import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import { Auth } from 'msmc';

const legacyRequire = createRequire(import.meta.url);
const { Client, Authenticator } = legacyRequire('minecraft-launcher-core');

const launcher = new Client();
let mainWindow: BrowserWindow | null = null;
let cachedMsToken: any = null; // Token'ı burada saklayacağız

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: true
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- MICROSOFT LOGIN HANDLER ---
ipcMain.handle('login-microsoft', async (event) => {
  try {
    const authManager = new Auth("select_account");
    const xboxManager = await authManager.launch("electron");
    const token = await xboxManager.getMinecraft();

    // Token'ı global değişkende sakla (fonksiyonları kaybetmemek için)
    cachedMsToken = token;

    // Frontend'e sadece JSON verisini gönder
    return { success: true, profile: token };
  } catch (e) {
    console.error("Login Hatası:", e);
    return { success: false, error: e };
  }
});

// --- SYSTEM INFO HANDLER ---
ipcMain.handle('get-system-ram', () => {
  return os.totalmem();
});

// --- OYUN BAŞLATMA LOGİĞİ ---
interface LaunchData {
  username: string;
  ram: string;
  type: 'offline' | 'microsoft';
  version: string; // Yeni: Versiyon bilgisi
  authObject?: any;
}

ipcMain.on('launch-game', (event, data: LaunchData) => {
  let authSetup;

  if (data.type === 'microsoft') {
    // Cached token varsa onu kullan, yoksa hata ver veya yeniden login iste
    if (cachedMsToken) {
      authSetup = cachedMsToken.mclc();
    } else {
      console.error("Microsoft token bulunamadı!");
      return;
    }
  } else {
    authSetup = Authenticator.getAuth(data.username);
  }

  const opts = {
    clientPackage: null,
    authorization: authSetup,
    root: "./minecraft",
    version: {
      number: data.version, // Dinamik versiyon
      type: "release"
    },
    memory: {
      max: data.ram,
      min: "2G"
    }
  };

  console.log(`Obsidian Launcher başlatılıyor... Mod: ${data.type}, Versiyon: ${data.version}`);

  launcher.launch(opts);

  launcher.on('debug', (e: any) => console.log('DEBUG:', e));

  launcher.on('data', (e: any) => {
    if (e.includes("Setting user")) {
      event.sender.send('game-launched');
    }
  });

  launcher.on('progress', (e: any) => {
    event.sender.send('progress', e);
  });
});