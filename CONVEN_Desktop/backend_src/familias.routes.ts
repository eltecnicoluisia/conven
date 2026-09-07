import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { antiGarabatosMiddleware } from './validator';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const familias = await prisma.familia.findMany({
      include: {
        propiedad: true,
        miembros: true
      }
    });
    const formated = familias.map(f => ({
      id: f.id,
      nombre: f.nombre,
      integrantes: f.miembros.length,
      apto: f.propiedad.numero,
      mascotas: f.mascotas || 'Ninguna',
      condicion: f.condicion || 'PROPIO',
      menores: f.menores || 0,
      adultos: f.adultos || 0,
      adultosMayores: f.adultosMayores || 0,
      discapacitados: f.discapacitados || 0
    }));
    res.json(formated);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching familias' });
  }
});

router.post('/', antiGarabatosMiddleware, async (req, res) => {
  try {
    const { nombre, propiedadId, mascotas, condicion, menores, adultos, adultosMayores, discapacitados } = req.body;
    let prop = await prisma.propiedad.findFirst({ where: { numero: propiedadId }});
    if (!prop) {
      const cond = await prisma.condominio.findFirst();
      if (!cond) return res.status(400).json({ error: 'No hay condominio configurado' });
      prop = await prisma.propiedad.create({
        data: {
          numero: propiedadId,
          alicuota: 1.0,
          condominioId: cond.id
        }
      });
    }

    const nueva = await prisma.familia.create({
      data: {
        nombre,
        propiedadId: prop.id,
        mascotas: mascotas || 'Ninguna',
        condicion: condicion || 'PROPIO',
        menores: parseInt(menores) || 0,
        adultos: parseInt(adultos) || 0,
        adultosMayores: parseInt(adultosMayores) || 0,
        discapacitados: parseInt(discapacitados) || 0
      }
    });

    res.json(nueva);
  } catch (error: any) {
    res.status(500).json({ error: 'Error creando familia' });
  }
});

// PUT /:id - Actualizar familia
router.put('/:id', antiGarabatosMiddleware, async (req, res) => {
  try {
    const { nombre, mascotas, condicion, menores, adultos, adultosMayores, discapacitados } = req.body;
    
    const familia = await prisma.familia.findUnique({
      where: { id: req.params.id }
    });

    if (!familia) {
      return res.status(404).json({ error: 'Familia no encontrada' });
    }

    const updated = await prisma.familia.update({
      where: { id: req.params.id },
      data: { 
        nombre,
        mascotas,
        condicion,
        menores: parseInt(menores) || 0,
        adultos: parseInt(adultos) || 0,
        adultosMayores: parseInt(adultosMayores) || 0,
        discapacitados: parseInt(discapacitados) || 0
      }
    });
    
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Error actualizando familia', detalle: error.message });
  }
});

// DELETE /:id - Eliminar familia
router.delete('/:id', async (req, res) => {
  try {
    await prisma.familia.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Error eliminando familia', detalle: error.message });
  }
});

export default router;
