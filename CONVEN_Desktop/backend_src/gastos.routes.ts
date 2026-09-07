import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { logShadowAudit } from './shadowLogger';

const router = Router();

// GET all expenses for a specific condominio
router.get('/', async (req: Request, res: Response) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'Usuario no tiene un condominio asignado.' });
    }

    const gastos = await prisma.gasto.findMany({
      where: { condominioId: userCondominioId },
      orderBy: { fecha: 'desc' }
    });
    res.json(gastos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new expense
router.post('/', async (req: Request, res: Response) => {
  const { concepto, categoria, monto, moneda, facturaRef } = req.body;
  
  try {
    const targetCondominioId = (req as any).user?.condominioId;
    const actorId = (req as any).user?.id || 'SISTEMA';

    if (!targetCondominioId) {
      return res.status(400).json({ error: 'Usuario no tiene un condominio asignado.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newGasto = await tx.gasto.create({
        data: {
          condominioId: targetCondominioId,
          concepto,
          categoria,
          monto: Number(monto),
          moneda,
          facturaRef
        }
      });

      const sysLog = await tx.logSistema.create({
        data: {
          condominioId: targetCondominioId,
          tipo: 'SISTEMA',
          mensaje: `Factura ${facturaRef || 'S/N'} registrada por ${monto} ${moneda} (${concepto})`,
          usuarioId: actorId,
          accion: 'CREATE',
          entidadAfectada: 'Gasto',
          datosNuevos: JSON.stringify(newGasto),
          hashIntegridad: ''
        }
      });

      return { newGasto, sysLog };
    });

    const hash = logShadowAudit({
      usuarioId: actorId,
      accion: 'CREATE',
      entidadAfectada: 'Gasto',
      datosNuevos: result.newGasto,
      mensaje: `Gasto registrado: ${concepto} - Ref: ${facturaRef}`
    });

    await prisma.logSistema.update({
      where: { id: result.sysLog.id },
      data: { hashIntegridad: hash }
    });

    res.status(201).json(result.newGasto);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'ALERTA DE SEGURIDAD: Esta factura ya fue registrada. Posible duplicación detectada.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT - update an expense
router.put('/:id', async (req: Request, res: Response) => {
  const { concepto, categoria, monto, moneda, facturaRef } = req.body;
  try {
    const updated = await prisma.gasto.update({
      where: { id: req.params.id },
      data: { concepto, categoria, monto: Number(monto), moneda, facturaRef }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE an expense
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.gasto.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST to close month and calculate distribution
router.post('/cierre', async (req: Request, res: Response) => {
  const { mes, anio, tasaBCV } = req.body;
  try {
    // 1. Get all expenses for this month that haven't been closed
    const gastosMes = await prisma.gasto.findMany({
      where: { 
        mesCierre: null,
        anioCierre: null 
      }
    });

    if (gastosMes.length === 0) {
      return res.status(400).json({ error: 'No hay gastos pendientes por facturar.' });
    }

    // 2. Sum them up
    let totalUSD = 0;
    let totalVES = 0;
    gastosMes.forEach(g => {
      if (g.moneda === 'USD') totalUSD += g.monto;
      if (g.moneda === 'VES') totalVES += g.monto;
    });

    // 3. Get all properties
    const propiedades = await prisma.propiedad.findMany();

    // 4. Calculate for each property
    const distribucion = propiedades.map(p => {
      const cuotaUSD = Number((totalUSD * p.alicuota).toFixed(2));
      const cuotaVES = Number((totalVES * p.alicuota).toFixed(2));
      return {
        propiedadId: p.numero,
        cuotaUSD,
        cuotaVES
      };
    });

    // 5. Create Avisos de Cobro
    const createdAvisos = [];
    for (const p of propiedades) {
      const cuotaUSD = Number((totalUSD * p.alicuota).toFixed(2));
      const cuotaVES = Number((totalVES * p.alicuota).toFixed(2));
      
      const aviso = await prisma.avisoCobro.create({
        data: {
          propiedadId: p.id,
          mes,
          anio,
          montoUSD: cuotaUSD,
          montoVES: cuotaVES,
          tasaBCV: Number(tasaBCV)
        }
      });
      createdAvisos.push(aviso);
    }

    // 6. Mark expenses as closed
    await prisma.gasto.updateMany({
      where: { 
        id: { in: gastosMes.map((g: any) => g.id) }
      },
      data: {
        mesCierre: mes,
        anioCierre: anio
      }
    });

    res.json({
      gastoTotalUSD: totalUSD,
      gastoTotalVES: totalVES,
      distribucion
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
