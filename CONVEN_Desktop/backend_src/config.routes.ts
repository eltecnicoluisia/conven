import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = Router();

// GET /api/config - Obtener configuración del condominio
router.get('/', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'Usuario no tiene un condominio asignado.' });
    }

    let condominio = await prisma.condominio.findUnique({
      where: { id: userCondominioId }
    });

    if (!condominio) {
      return res.status(404).json({ error: 'Condominio no encontrado' });
    }
    res.json(condominio);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
});

// PUT /api/config/:id - Actualizar configuración del condominio
router.put('/:id', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId || userCondominioId !== req.params.id) {
       return res.status(403).json({ error: 'No autorizado para editar este condominio' });
    }

    const { 
      nombre, 
      rif, 
      direccion, 
      administrador, 
      telefono, 
      email,
      modoCobro,
      numTorres,
      tieneLocalesPB,
      tieneMezzanina
    } = req.body;
    const updated = await prisma.condominio.update({
      where: { id: req.params.id },
      data: {
        nombre,
        rif,
        direccion,
        administrador,
        telefono,
        email,
        modoCobro: modoCobro !== undefined ? String(modoCobro) : undefined,
        numTorres: numTorres !== undefined ? Number(numTorres) : undefined,
        tieneLocalesPB: tieneLocalesPB !== undefined ? Boolean(tieneLocalesPB) : undefined,
        tieneMezzanina: tieneMezzanina !== undefined ? Boolean(tieneMezzanina) : undefined
      }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
});

export default router;
