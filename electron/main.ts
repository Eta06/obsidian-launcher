import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import { Auth } from 'msmc';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const legacyRequire = createRequire(import.meta.url);
const { Client, Authenticator } = legacyRequire('minecraft-launcher-core');

const launcher = new Client();
let mainWindow: BrowserWindow | null = null;
let cachedMsToken: any = null; // Token'ı burada saklayacağız
let splashWindow: BrowserWindow | null = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    resizable: false,
    center: true
  });

  const splashPath = process.env.ELECTRON_START_URL
    ? path.join(__dirname, '../public/splash.html')
    : path.join(__dirname, '../dist/splash.html');

  splashWindow.loadURL(`file://${splashPath}`);

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: true
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
      }
      if (mainWindow) {
        mainWindow.show();
      }
    }, 2000);
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
});

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