import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { antiGarabatosMiddleware } from './validator';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const inspecciones = await prisma.inspeccion.findMany({
      include: {
        infraestructura: true
      },
      orderBy: { fecha: 'desc' }
    });
    const formated = inspecciones.map(i => ({
      id: i.id,
      fecha: i.fecha,
      infraestructuraId: i.infraestructura?.nombre || 'Area General',
      tecnico: i.inspector,
      observaciones: i.observaciones,
      resultado: i.nivelGravedad === 'NORMAL' ? 'APROBADO' : i.nivelGravedad === 'CRITICO' ? 'RECHAZADO' : 'OBSERVACION'
    }));
    res.json(formated);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inspecciones' });
  }
});

router.post('/', antiGarabatosMiddleware, async (req, res) => {
  try {
    const { inspector, observaciones, nivelGravedad, infraestructuraId } = req.body;
    let infraId: string | null = null;
    if (infraestructuraId) {
      const infra = await prisma.infraestructura.findFirst({ where: { nombre: infraestructuraId }});
      if (infra) infraId = infra.id;
    }

    const nueva = await prisma.inspeccion.create({
      data: {
        inspector,
        observaciones,
        nivelGravedad: nivelGravedad || 'NORMAL',
        infraestructuraId: infraId
      }
    });

    res.json(nueva);
  } catch (error: any) {
    res.status(500).json({ error: 'Error creando inspeccion' });
  }
});

// PUT /:id - Actualizar inspeccion
router.put('/:id', antiGarabatosMiddleware, async (req, res) => {
  try {
    const { inspector, observaciones, nivelGravedad } = req.body;
    const updated = await prisma.inspeccion.update({
      where: { id: req.params.id },
      data: { inspector, observaciones, nivelGravedad }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Error actualizando inspeccion', detalle: error.message });
  }
});

// DELETE /:id - Eliminar inspeccion
router.delete('/:id', async (req, res) => {
  try {
    await prisma.inspeccion.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Error eliminando inspeccion', detalle: error.message });
  }
});

export default router;
