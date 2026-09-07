import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = Router();


router.get('/:condominioId', async (req, res) => {
  try {
    let { condominioId } = req.params;
    if (condominioId === 'default' || !condominioId) {
      const first = await prisma.condominio.findFirst();
      if(first) condominioId = first.id;
    }

    // 1. Fondo de Reserva
    const fondo = await prisma.fondoReserva.findUnique({
      where: { condominioId }
    });

    // 2. Deuda Activa
    const propiedades = await prisma.propiedad.findMany({
      where: { condominioId },
      select: { id: true }
    });
    const propiedadIds = propiedades.map(p => p.id);

    const avisosPendientes = await prisma.avisoCobro.findMany({
      where: {
        propiedadId: { in: propiedadIds },
        pagado: false
      },
      include: { propiedad: true }
    });

    let deudaActivaUSD = 0;
    avisosPendientes.forEach(a => deudaActivaUSD += a.montoUSD);
    const residentesEnMora = new Set(avisosPendientes.map(a => a.propiedadId)).size;

    // 3. Gasto Mensual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const gastosMes = await prisma.gasto.findMany({
      where: { condominioId, mesCierre: currentMonth, anioCierre: currentYear }
    });
    let gastoMensualUSD = 0;
    gastosMes.forEach(g => { if (g.moneda === 'USD') gastoMensualUSD += g.monto; });

    // 4. Saldo Bancos
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { condominioId }
    });
    let saldoBancosUSD = 0;
    let saldoBancosVES = 0;
    cuentas.forEach(c => {
      saldoBancosUSD += c.saldoUSD;
      saldoBancosVES += c.saldoVES;
    });

    // 5. Logs
    const logs = await prisma.logSistema.findMany({
      where: { condominioId },
      orderBy: { fecha: 'desc' },
      take: 5
    });

    res.json({
      fondoReserva: { saldoUSD: fondo?.saldoUSD || 0, porcentaje: fondo?.porcentaje || 10 },
      deudaActiva: { montoUSD: deudaActivaUSD, residentesEnMora },
      gastoMensual: { montoUSD: gastoMensualUSD, mes: currentMonth, anio: currentYear },
      saldoBancos: { totalUSD: saldoBancosUSD, totalVES: saldoBancosVES },
      logs
    });
  } catch (error) {
    console.error("Error obteniendo dashboard:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
