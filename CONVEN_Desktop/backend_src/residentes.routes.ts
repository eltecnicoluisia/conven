import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { antiGarabatosMiddleware } from './validator';

const router = Router();
const prisma = new PrismaClient();

// Get todos los residentes
router.get('/', async (req, res) => {
  try {
    const residentes = await prisma.residente.findMany({
      include: {
        propiedad: true,
        familia: true
      }
    });
    // Formatear para el frontend
    const formated = residentes.map(r => ({
      apt: r.propiedad.numero,
      nombre: r.nombre,
      rol: r.esPropietario ? 'PROPIETARIO' : 'INQUILINO',
      estado: 'ACTIVO' // Simplificación
    }));
    res.json(formated);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching residentes' });
  }
});

// Create residente
router.post('/', antiGarabatosMiddleware, async (req, res) => {
  try {
    const { nombre, email, telefono, propiedadId, esPropietario } = req.body;
    
    // Asumimos que la propiedad existe o la creamos dummy si no existe
    // En un sistema real esto se valida mejor
    let prop = await prisma.propiedad.findFirst({ where: { numero: propiedadId }});
    if (!prop) {
      // Necesitamos un condominio default
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

    const nuevo = await prisma.residente.create({
      data: {
        nombre,
        email: email || `${nombre.replace(/\s+/g, '')}@test.com`,
        telefono: telefono || '',
        esPropietario: esPropietario === 'PROPIETARIO' || esPropietario === true,
        propiedadId: prop.id
      }
    });

    res.json(nuevo);
  } catch (error: any) {
    res.status(500).json({ error: 'Error creando residente', detalle: error.message });
  }
});

export default router;
