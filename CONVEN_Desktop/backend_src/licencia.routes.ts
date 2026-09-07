import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Endpoint para verificar estado de la licencia
router.get('/status', async (req, res) => {
  try {
    const licencia = await prisma.licenciaSoftware.findFirst({ where: { activa: true } });
    if (licencia) {
      return res.json({ activado: true, licencia: licencia.llave });
    }
    return res.json({ activado: false });
  } catch (err) {
    console.error('Error verificando licencia:', err);
    res.status(500).json({ activado: false, error: 'Error interno verificando licencia' });
  }
});

// Endpoint para activar licencia
router.post('/activar', async (req, res) => {
  try {
    const { llave } = req.body;
    if (!llave || llave.length !== 15) {
      return res.status(400).json({ error: 'La licencia debe tener exactamente 15 caracteres alfanumericos.' });
    }
    
    // Aqui podriamos contactar a un servidor central si hubiera internet, pero como es offline:
    // Solo validamos que tenga 15 caracteres y quizas un formato matematico interno.
    // Para simplificar, aceptaremos cualquier llave de 15 caracteres. 
    // Un sistema mas avanzado validaria una firma criptografica RSA.
    
    // Desactivar licencias previas
    await prisma.licenciaSoftware.updateMany({ data: { activa: false } });
    
    // Registrar nueva licencia
    await prisma.licenciaSoftware.create({
      data: {
        llave,
        activa: true
      }
    });
    
    res.json({ message: 'Sistema activado exitosamente.' });
  } catch (err) {
    console.error('Error activando licencia:', err);
    res.status(500).json({ error: 'Fallo interno al activar la licencia.' });
  }
});

export default router;
