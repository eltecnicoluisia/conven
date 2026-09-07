import express from 'express';
import cors from 'cors';
import { MotorCondominio } from '@condominio/core-bimonetario';
import { Decimal } from 'decimal.js';

import infraestructuraRoutes from './routes/infraestructura';
import familiasRoutes from './routes/familias';
import inspeccionesRoutes from './routes/inspecciones';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const motor = new MotorCondominio('36.50'); 

app.use('/api/infraestructura', infraestructuraRoutes);
app.use('/api/familias', familiasRoutes);
app.use('/api/inspecciones', inspeccionesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.1.0' });
});

app.post('/api/facturacion/calcular', (req, res) => {
  try {
    const { gastos, propiedades } = req.body;
    
    const gastosDecimal = gastos.map((g: any) => ({ ...g, monto: new Decimal(g.monto) }));
    const propiedadesDecimal = propiedades.map((p: any) => ({ ...p, alicuota: new Decimal(p.alicuota) }));

    const gastoTotalUSD = motor.calcularGastoTotal(gastosDecimal, 'USD');
    const distribucion = motor.distribuirGastos(gastoTotalUSD, propiedadesDecimal);

    res.json({
      gastoTotalUSD: gastoTotalUSD.toString(),
      gastoTotalVES: gastoTotalUSD.times(36.50).toString(),
      tasaBcv: '36.50',
      distribucion: distribucion.map(d => ({
        propiedadId: d.propiedadId,
        cuotaUSD: d.cuota.toString(),
        cuotaVES: d.cuota.times(36.50).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()
      }))
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`[API Condominio] Servidor inicializado en el puerto ${port}`);
  console.log(`[API Condominio] Motor de Al├¡cuotas (LPH) y BCV: Activo`);
});
