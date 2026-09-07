import express from 'express';
import cors from 'cors';
import { Decimal } from 'decimal.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

// Motor Financiero Bimonetario inline (reemplaza @condominio/core-bimonetario)
class MotorCondominio {
  private tasa: Decimal;
  constructor(tasa: string) { this.tasa = new Decimal(tasa); }
  calcularGastoTotal(gastos: any[], moneda: string): Decimal {
    const totalUSD = gastos.reduce((acc: Decimal, g: any) => {
      const monto = new Decimal(g.monto);
      if (g.moneda === 'VES') return acc.plus(monto.dividedBy(this.tasa));
      return acc.plus(monto);
    }, new Decimal(0));
    if (moneda === 'VES') return totalUSD.times(this.tasa);
    return totalUSD;
  }
}

import infraestructuraRoutes from './infraestructura.routes';
import familiasRoutes from './familias.routes';
import inspeccionesRoutes from './inspecciones.routes';
import gastosRoutes from './gastos.routes';
import residentesRoutes from './residentes.routes';
import dashboardRoutes from './dashboard.routes';
import tesoreriaRoutes from './tesoreria.routes';
import configRoutes from './config.routes';
import propiedadesRoutes from './propiedades.routes';
import authRoutes from './auth.routes';
import usuariosRoutes from './usuarios.routes';
import auditoriaRoutes from './auditoria.routes';
import licenciaRoutes from './licencia.routes';
import { authMiddleware } from './authMiddleware';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
import path from 'path';
// Servir frontend estatico (ANTES de middleware de licencia)
app.use(express.static(path.join(__dirname, '../public')));


// Middleware global para bloquear el sistema si no hay licencia
app.use(async (req, res, next) => {
  // Permitir endpoints públicos o de activación
  if (req.path.startsWith('/api/licencia') || req.path === '/api/health' || req.path.startsWith('/api/auth')) {
    return next();
  }
  
  try {
    const licencia = await prisma.licenciaSoftware.findFirst({ where: { activa: true } });
    if (!licencia) {
      return res.status(402).json({ error: 'SISTEMA BLOQUEADO: Licencia Requerida', code: 'LICENSE_REQUIRED' });
    }
    next();
  } catch (err) {
    console.error('Error verificando licencia global:', err);
    res.status(500).json({ error: 'Error validando licencia del sistema.' });
  }
});

const motor = new MotorCondominio('36.50'); 

// Rutas públicas (no requieren token)
app.use('/api/auth', authRoutes);
app.use('/api/licencia', licenciaRoutes);

// Rutas protegidas con JWT
app.use('/api/infraestructura', authMiddleware, infraestructuraRoutes);
app.use('/api/familias', authMiddleware, familiasRoutes);
app.use('/api/inspecciones', authMiddleware, inspeccionesRoutes);
app.use('/api/gastos', authMiddleware, gastosRoutes);
app.use('/api/residentes', authMiddleware, residentesRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/tesoreria', authMiddleware, tesoreriaRoutes);
app.use('/api/config', authMiddleware, configRoutes);
app.use('/api/propiedades', authMiddleware, propiedadesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.2.0' });
});

// Calculate actual month's expenses based on DB
app.post('/api/facturacion/calcular', authMiddleware, async (req, res) => {
  try {
    const { mes, anio, tasaBCV } = req.body;
    const currentTasa = tasaBCV || '36.50';
    const currentMotor = new MotorCondominio(currentTasa);

    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'Usuario no tiene un condominio asignado.' });
    }

    // Fetch all pending expenses
    const gastosPendientes = await prisma.gasto.findMany({
      where: { mesCierre: null, anioCierre: null, condominioId: userCondominioId }
    });

    if (gastosPendientes.length === 0) {
      return res.status(400).json({ error: 'No hay gastos pendientes por facturar en este mes.' });
    }

    // Fetch all properties
    const propiedades = await prisma.propiedad.findMany({
      where: { condominioId: userCondominioId }
    });
    if (propiedades.length === 0) {
      return res.status(400).json({ error: 'No hay propiedades registradas.' });
    }

    const gastosDecimal = gastosPendientes.map((g: any) => ({ ...g, monto: new Decimal(g.monto) }));
    const gastoTotalUSD = currentMotor.calcularGastoTotal(gastosDecimal, 'USD');

    // Motor Financiero Dinámico: Partes Iguales vs Alícuotas
    const condo = await prisma.condominio.findUnique({ where: { id: userCondominioId } });
    const modoCobro = condo?.modoCobro || 'ALICUOTAS';

    const distribucion: { propiedadId: string; cuota: Decimal }[] = [];
    if (modoCobro === 'PARTES_IGUALES') {
      const cuotaEquitativa = gastoTotalUSD.dividedBy(propiedades.length).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      for (const p of propiedades) {
        distribucion.push({ propiedadId: p.id, cuota: cuotaEquitativa });
      }
    } else if (modoCobro === 'TARIFA_M2') {
      // Cobro basado en Metros Cuadrados x Precio por m² (Tarifa Fija M2)
      for (const p of propiedades) {
        const m2 = new Decimal(p.m2 || 0);
        const precio = new Decimal(p.precioM2 || 0);
        const cuota = m2.times(precio).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        distribucion.push({ propiedadId: p.id, cuota });
      }
    } else if (modoCobro === 'CUOTA_FIJA') {
      // Cobro basado exclusivamente en la cuota fija asignada a la unidad
      for (const p of propiedades) {
        const cuota = new Decimal(p.cuotaFija || 0).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        distribucion.push({ propiedadId: p.id, cuota });
      }
    } else {
      // Por defecto: ALICUOTAS (Cobro por porcentaje %)
      for (const p of propiedades) {
        const alic = new Decimal(p.alicuota || 0);
        // Si alícuota se maneja en porcentaje (ej 5%), se divide entre 100
        const cuotaAlicuota = gastoTotalUSD.times(alic).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        distribucion.push({ propiedadId: p.id, cuota: cuotaAlicuota });
      }
    }

    // Guardar avisos y cerrar gastos
    const distribucionDB: { propiedadId: string; cuotaUSD: string; cuotaVES: string }[] = [];

    // Optional: Only save to DB if 'save' flag is sent, allowing dry-runs
    if (req.body.save) {
      for (const d of distribucion) {
        const pInfo = propiedades.find(p => p.id === d.propiedadId || p.numero === d.propiedadId);
        
        await prisma.avisoCobro.create({
          data: {
            propiedadId: pInfo?.id || d.propiedadId, // Usamos el ID interno
            mes: Number(mes) || new Date().getMonth() + 1,
            anio: Number(anio) || new Date().getFullYear(),
            montoUSD: d.cuota.toNumber(),
            montoVES: d.cuota.times(currentTasa).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
            tasaBCV: Number(currentTasa)
          }
        });
        
        distribucionDB.push({
          propiedadId: pInfo?.numero || d.propiedadId,
          cuotaUSD: d.cuota.toString(),
          cuotaVES: d.cuota.times(currentTasa).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()
        });
      }

      await prisma.gasto.updateMany({
        where: { id: { in: gastosPendientes.map(g => g.id) } },
        data: { mesCierre: Number(mes) || new Date().getMonth() + 1, anioCierre: Number(anio) || new Date().getFullYear() }
      });
    } else {
      for (const d of distribucion) {
        const pInfo = propiedades.find(p => p.id === d.propiedadId || p.numero === d.propiedadId);
        distribucionDB.push({
          propiedadId: pInfo?.numero || d.propiedadId,
          cuotaUSD: d.cuota.toString(),
          cuotaVES: d.cuota.times(currentTasa).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()
        });
      }
    }

    res.json({
      gastoTotalUSD: gastoTotalUSD.toString(),
      gastoTotalVES: gastoTotalUSD.times(currentTasa).toString(),
      tasaBcv: currentTasa,
      distribucion: distribucionDB
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

async function initDefaultData() {
  try {
    const count = await prisma.condominio.count();
    if (count === 0) {
      const condo = await prisma.condominio.create({
        data: { nombre: 'Condominio Principal', rif: 'J-00000000-0' }
      });
      // Create default fondo de reserva
      await prisma.fondoReserva.create({
        data: { condominioId: condo.id, saldoUSD: 0, porcentaje: 10 }
      });
      console.log(`[API Condominio] Condominio por defecto creado: ${condo.id}`);
    }

    // Auto-create default SUPERADMIN
    const adminUser = await prisma.usuario.findUnique({ where: { username: 'admin' } });
    if (!adminUser) {
      const passwordHash = await bcrypt.hash('Admin2025*', 10);
      await prisma.usuario.create({
        data: {
          username: 'admin',
          email: 'admin@conven.local',
          passwordHash,
          rol: 'SUPERADMIN',
          activo: true
        }
      });
      console.log('[API Condominio] Usuario SUPERADMIN creado automáticamente (admin / Admin2025*)');
    }
  } catch (e: any) {
    console.error('[API Condominio] Error al inicializar datos:', e.message);
  }
}


// Fallback para SPA
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, async () => {
  console.log(`[API Condominio] Servidor inicializado en el puerto ${port}`);
  console.log(`[API Condominio] Motor de Alícuotas (LPH) y BCV: Activo`);
  await initDefaultData();
});
