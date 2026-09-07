const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// ─── RUTAS DE DATOS (usar AppData del usuario para SQLite) ───────────────────
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'conven.db');

// Asegurarse de que la carpeta userData exista
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Configurar variables de entorno ANTES de cargar cualquier módulo
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.JWT_SECRET   = process.env.JWT_SECRET || 'conven-desktop-secret-2025';

// Prisma necesita sus binarios fuera del ASAR (.asar.unpacked) en producción
// __dirname dentro del ASAR apunta a app.asar, pero los binarios están en app.asar.unpacked
if (app.isPackaged) {
  const unpackedDir = __dirname.replace('app.asar', 'app.asar.unpacked');
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
    unpackedDir,
    'node_modules',
    '.prisma',
    'client',
    'libquery_engine-windows.dll.node'
  );
  process.env.PRISMA_SCHEMA_ENGINE_PATH = path.join(
    unpackedDir,
    'node_modules',
    '.prisma',
    'client'
  );
}

// ─── CREAR VENTANA PRINCIPAL ──────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    title: 'CONVEN Desktop',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Servir el frontend desde Express en el puerto 4321
  const frontendServer = express();
  frontendServer.use(express.static(path.join(__dirname, 'public')));

  // Fallback SPA: todas las rutas devuelven index.html
  frontendServer.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  frontendServer.listen(4321, '127.0.0.1', () => {
    mainWindow.loadURL('http://127.0.0.1:4321');
  });

  // Si la ventana falla al cargar, mostrar un mensaje de error básico
  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.loadURL(`data:text/html,<h1>CONVEN Desktop</h1><p>Iniciando servidor, por favor espera...</p>`);
    setTimeout(() => mainWindow.loadURL('http://127.0.0.1:4321'), 3000);
  });
}

// ─── INICIAR BACKEND API (EXPRESS en puerto 3001) ─────────────────────────────
function startBackend() {
  try {
    // Intentar cargar el backend compilado (backend_dist)
    require('./backend_dist/index');
    console.log('[CONVEN] Backend API iniciado en puerto 3001');
  } catch (e) {
    console.error('[CONVEN] Error al iniciar backend:', e.message);
    // El frontend seguirá abierto, pero las llamadas API fallarán con error de red
    // La pantalla de login mostrará un mensaje de error al intentar conectar
  }
}

// ─── ARRANQUE ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();   // Abrir ventana PRIMERO (sin esperar al backend)
  startBackend();   // Luego intentar iniciar el backend
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
