import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Directorio oculto para logs forenses
const AUDIT_DIR = path.join(__dirname, '..', '.audit_vault');
const SHADOW_LOG_FILE = path.join(AUDIT_DIR, 'shadow.log');

// Asegurar que el directorio oculto existe al inicializar
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

export function logShadowAudit(payload: {
  usuarioId: string;
  accion: string;
  entidadAfectada: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  mensaje: string;
}) {
  const timestamp = new Date().toISOString();
  
  // Hash de integridad WORM
  const rawData = JSON.stringify(payload) + timestamp;
  const hashIntegridad = crypto.createHash('sha256').update(rawData).digest('hex');

  const logEntry = JSON.stringify({
    timestamp,
    hashIntegridad,
    ...payload
  }) + '\n';

  // Escritura Append-Only de grado militar
  fs.appendFile(SHADOW_LOG_FILE, logEntry, (err) => {
    if (err) {
      console.error('ERROR CRITICO AUDITORIA: Fallo escritura de Shadow Log', err);
    }
  });

  return hashIntegridad;
}
