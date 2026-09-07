import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware, requireSuperAdmin } from './authMiddleware';

const router = Router();

const AUDIT_DIR = path.join(__dirname, '..', '.audit_vault');
const SHADOW_LOG_FILE = path.join(AUDIT_DIR, 'shadow.log');

// Ruta forense altamente restringida (Solo SUPERADMIN)
router.get('/shadow-log', authMiddleware, requireSuperAdmin, (req, res) => {
  if (!fs.existsSync(SHADOW_LOG_FILE)) {
    return res.status(404).json({ error: 'Log sombra no encontrado.' });
  }

  try {
    // Para logs gigantes, lo ideal es usar streams.
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=shadow_audit.log');
    
    const fileStream = fs.createReadStream(SHADOW_LOG_FILE);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error enviando shadow log:', error);
    res.status(500).json({ error: 'Fallo interno al exportar auditoría.' });
  }
});

export default router;
