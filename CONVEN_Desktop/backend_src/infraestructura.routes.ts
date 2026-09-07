import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { antiGarabatosMiddleware } from './validator';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const infraestructuras = await prisma.infraestructura.findMany();
    const formated = infraestructuras.map(i => ({
      id: i.id,
      nombre: i.nombre,
      tipo: i.tipo,
      estado: i.estado,
      update: i.fechaUltimoMantenimiento ? new Date(i.fechaUltimoMantenimiento).toLocaleDateString() : 'Reciente'
    }));
    res.json(formated);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching infraestructura' });
  }
});

router.post('/', antiGarabatosMiddleware, async (req, res) => {
  try {
    const { nombre, tipo, estado } = req.body;
    const cond = await prisma.condominio.findFirst();
    if (!cond) return res.status(400).json({ error: 'No hay condominio configurado' });

    const nueva = await prisma.infraestructura.create({
      data: {
        nombre,
        tipo: tipo || 'OTROS',
        estado: estado || 'OPERATIVO',
        condominioId: cond.id,
        fechaUltimoMantenimiento: new Date()
      }
    });

    res.json(nueva);
  } catch (error: any) {
    res.status(500).json({ error: 'Error creando infraestructura' });
  }
});

export default router;
