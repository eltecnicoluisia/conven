import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { Decimal } from 'decimal.js';

const router = Router();

// GET /api/propiedades - Listar propiedades del condominio con sus residentes
router.get('/', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'Usuario no tiene un condominio asignado.' });
    }

    const propiedades = await prisma.propiedad.findMany({
      where: { condominioId: userCondominioId },
      include: {
        residentes: true,
        familias: true
      },
      orderBy: [
        { torre: 'asc' },
        { piso: 'asc' },
        { numero: 'asc' }
      ]
    });

    res.json(propiedades);
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    res.status(500).json({ error: 'Error al obtener lista de inmuebles' });
  }
});

// POST /api/propiedades - Crear nueva propiedad/unidad
router.post('/', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'Usuario no tiene condominio asignado.' });
    }

    const { numero, alicuota, m2, tipo, torre, piso, precioM2, cuotaFija } = req.body;

    const nuevaPropiedad = await prisma.propiedad.create({
      data: {
        condominioId: userCondominioId,
        numero: String(numero),
        alicuota: Number(alicuota || 0),
        m2: Number(m2 || 0),
        precioM2: Number(precioM2 || 0),
        cuotaFija: Number(cuotaFija || 0),
        tipo: String(tipo || 'APARTAMENTO'),
        torre: torre ? String(torre) : 'Torre Única',
        piso: piso ? String(piso) : '1'
      }
    });

    res.json(nuevaPropiedad);
  } catch (error: any) {
    console.error('Error al crear propiedad:', error);
    res.status(500).json({ error: 'Error al crear la unidad en la base de datos' });
  }
});

// PUT /api/propiedades/:id - Actualizar propiedad
router.put('/:id', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    const { id } = req.params;
    const { numero, alicuota, m2, tipo, torre, piso, precioM2, cuotaFija } = req.body;

    const prop = await prisma.propiedad.findFirst({
      where: { id, condominioId: userCondominioId }
    });
    if (!prop) {
      return res.status(404).json({ error: 'Inmueble no encontrado' });
    }

    const actualizada = await prisma.propiedad.update({
      where: { id },
      data: {
        numero: numero !== undefined ? String(numero) : prop.numero,
        alicuota: alicuota !== undefined ? Number(alicuota) : prop.alicuota,
        m2: m2 !== undefined ? Number(m2) : prop.m2,
        precioM2: precioM2 !== undefined ? Number(precioM2) : prop.precioM2,
        cuotaFija: cuotaFija !== undefined ? Number(cuotaFija) : prop.cuotaFija,
        tipo: tipo !== undefined ? String(tipo) : prop.tipo,
        torre: torre !== undefined ? String(torre) : prop.torre,
        piso: piso !== undefined ? String(piso) : prop.piso,
      }
    });

    res.json(actualizada);
  } catch (error) {
    console.error('Error al actualizar propiedad:', error);
    res.status(500).json({ error: 'Error al modificar inmueble' });
  }
});

// DELETE /api/propiedades/:id - Eliminar propiedad
router.delete('/:id', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    const { id } = req.params;

    const prop = await prisma.propiedad.findFirst({
      where: { id, condominioId: userCondominioId }
    });
    if (!prop) {
      return res.status(404).json({ error: 'Inmueble no encontrado' });
    }

    // Attempt delete
    await prisma.propiedad.delete({ where: { id } });
    res.json({ success: true, message: 'Unidad eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando propiedad:', error);
    res.status(500).json({ error: 'No se puede eliminar la unidad porque tiene registros de pagos o avisos asociados.' });
  }
});

// POST /api/propiedades/recalcular-alicuotas - Motor Financiero: Recalcula alícuotas basadas en m2 para sumar 100%
router.post('/recalcular-alicuotas', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'Condominio no asignado.' });
    }

    const propiedades = await prisma.propiedad.findMany({
      where: { condominioId: userCondominioId },
      orderBy: { id: 'asc' }
    });

    if (propiedades.length === 0) {
      return res.status(400).json({ error: 'No hay propiedades registradas en el condominio.' });
    }

    const totalM2 = propiedades.reduce((acc, p) => acc + (Number(p.m2) || 0), 0);
    if (totalM2 <= 0) {
      return res.status(400).json({ 
        error: 'El total de metros cuadrados (m²) es 0. Por favor asigne el tamaño en m² a las unidades para poder distribuir las alícuotas porcentuales.' 
      });
    }

    // Distribute percentages accurately to 4 decimals using Decimal.js
    let totalCalculada = new Decimal(0);
    const totalM2Dec = new Decimal(totalM2);

    const actualizaciones = [];

    for (let i = 0; i < propiedades.length; i++) {
      const prop = propiedades[i];
      const m2Dec = new Decimal(prop.m2 || 0);
      let alicuota: Decimal;

      if (i === propiedades.length - 1) {
        // La última propiedad absorbe la pequeña diferencia de redondeo para garantizar exactamente 100%
        alicuota = new Decimal(100).minus(totalCalculada);
        if (alicuota.lessThan(0)) alicuota = new Decimal(0);
      } else {
        alicuota = m2Dec.dividedBy(totalM2Dec).times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
        totalCalculada = totalCalculada.plus(alicuota);
      }

      actualizaciones.push(
        prisma.propiedad.update({
          where: { id: prop.id },
          data: { alicuota: alicuota.toNumber() }
        })
      );
    }

    await prisma.$transaction(actualizaciones);

    const listaActualizada = await prisma.propiedad.findMany({
      where: { condominioId: userCondominioId },
      orderBy: [
        { torre: 'asc' },
        { piso: 'asc' },
        { numero: 'asc' }
      ]
    });

    res.json({ 
      success: true, 
      mensaje: 'Alícuotas recalculadas satisfactoriamente para sumar exactamente 100%.',
      totalM2,
      propiedades: listaActualizada 
    });

  } catch (error) {
    console.error('Error recalcuando alícuotas:', error);
    res.status(500).json({ error: 'Error al ejecutar el cálculo matemático de alícuotas.' });
  }
});

// POST /api/propiedades/generar-estructura - Generador automático de torres, pisos, locales y apartamentos
router.post('/generar-estructura', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'No autorizado' });
    }

    const { 
      torres, // Array de nombres Ej: ["Torre A", "Torre B"] o ["Único"]
      numPisos, 
      aptosPorPiso, 
      m2Apto, 
      precioM2Apto,
      cuotaFijaApto,
      tienePB, 
      numLocalesPB, 
      m2LocalPB, 
      precioM2LocalPB,
      cuotaFijaLocalPB,
      tieneMezzanina, 
      numLocalesMez, 
      m2Mez,
      precioM2Mez,
      cuotaFijaMez,
      configPorPiso,
      borrarExistant // true si se desea reiniciar las propiedades
    } = req.body;

    if (borrarExistant) {
      // Opcionalmente podemos limpiar inmuebles si el usuario pidió reiniciar (cuidado con relaciones)
      try {
        await prisma.propiedad.deleteMany({ where: { condominioId: userCondominioId } });
      } catch (e) {
        return res.status(400).json({ error: 'No se pudieron borrar los inmuebles actuales porque ya tienen avisos, pagos o residentes registrados.' });
      }
    }

    const torresLista: string[] = Array.isArray(torres) && torres.length > 0 ? torres : ['Torre Única'];
    const nuevasPropiedades = [];

    for (const torre of torresLista) {
      // 1. Locales en Planta Baja
      if (tienePB && numLocalesPB > 0) {
        for (let l = 1; l <= numLocalesPB; l++) {
          nuevasPropiedades.push({
            condominioId: userCondominioId,
            numero: `Local PB-${l} (${torre})`,
            m2: Number(m2LocalPB || 50),
            precioM2: Number(precioM2LocalPB || 0),
            cuotaFija: Number(cuotaFijaLocalPB || 0),
            tipo: 'LOCAL',
            torre: torre,
            piso: 'PB',
            alicuota: 0
          });
        }
      }

      // 2. Locales en Mezzanina
      if (tieneMezzanina && numLocalesMez > 0) {
        for (let m = 1; m <= numLocalesMez; m++) {
          nuevasPropiedades.push({
            condominioId: userCondominioId,
            numero: `Mez-${m} (${torre})`,
            m2: Number(m2Mez || 45),
            precioM2: Number(precioM2Mez || 0),
            cuotaFija: Number(cuotaFijaMez || 0),
            tipo: 'MEZZANINA',
            torre: torre,
            piso: 'Mezzanina',
            alicuota: 0
          });
        }
      }

      // 3. Apartamentos por Piso (Simétrico o Asimétrico)
      if (Array.isArray(configPorPiso) && configPorPiso.length > 0) {
        // MODO ASIMÉTRICO
        for (const cfg of configPorPiso) {
          for (let a = 1; a <= cfg.cant; a++) {
            const aptoNum = `${cfg.piso}${a.toString().padStart(2, '0')}`;
            nuevasPropiedades.push({
              condominioId: userCondominioId,
              numero: `Apto ${aptoNum} (${torre})`,
              m2: Number(cfg.m2 || 70),
              precioM2: Number(cfg.precioM2 || 0),
              cuotaFija: Number(cfg.cuotaFija || 0),
              tipo: 'APARTAMENTO',
              torre: torre,
              piso: `Piso ${cfg.piso}`,
              alicuota: 0
            });
          }
        }
      } else {
        // MODO SIMÉTRICO TRADICIONAL
        for (let p = 1; p <= (numPisos || 1); p++) {
          for (let a = 1; a <= (aptosPorPiso || 2); a++) {
            const aptoNum = `${p}${a.toString().padStart(2, '0')}`;
            nuevasPropiedades.push({
              condominioId: userCondominioId,
              numero: `Apto ${aptoNum} (${torre})`,
              m2: Number(m2Apto || 70),
              precioM2: Number(precioM2Apto || 0),
              cuotaFija: Number(cuotaFijaApto || 0),
              tipo: 'APARTAMENTO',
              torre: torre,
              piso: `Piso ${p}`,
              alicuota: 0
            });
          }
        }
      }
    }

    await prisma.propiedad.createMany({
      data: nuevasPropiedades
    });

    // Ahora invocamos internamente un recálculo para asignar las alícuotas
    const todas = await prisma.propiedad.findMany({ where: { condominioId: userCondominioId }, orderBy: { id: 'asc' } });
    const totalM2 = todas.reduce((acc, prop) => acc + (Number(prop.m2) || 0), 0);
    if (totalM2 > 0) {
      let totalCalc = new Decimal(0);
      const updates = [];
      for (let i = 0; i < todas.length; i++) {
        const prop = todas[i];
        let alic: Decimal;
        if (i === todas.length - 1) {
          alic = new Decimal(100).minus(totalCalc);
          if (alic.lessThan(0)) alic = new Decimal(0);
        } else {
          alic = new Decimal(prop.m2).dividedBy(totalM2).times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
          totalCalc = totalCalc.plus(alic);
        }
        updates.push(prisma.propiedad.update({ where: { id: prop.id }, data: { alicuota: alic.toNumber() } }));
      }
      if (updates.length > 0) await prisma.$transaction(updates);
    }

    const listaFinal = await prisma.propiedad.findMany({
      where: { condominioId: userCondominioId },
      orderBy: [{ torre: 'asc' }, { piso: 'asc' }, { numero: 'asc' }]
    });

    res.json({
      success: true,
      mensaje: `Estructura arquitectónica de ${nuevasPropiedades.length} unidades creada exitosamente. Alícuotas distribuidas por m².`,
      propiedades: listaFinal
    });

  } catch (error) {
    console.error('Error generando estructura:', error);
    res.status(500).json({ error: 'Error general al crear la arquitectura del edificio.' });
  }
});

// POST /api/propiedades/fusionar - Fusionar dos inmuebles en uno
router.post('/fusionar', async (req, res) => {
  try {
    const userCondominioId = (req as any).user?.condominioId;
    if (!userCondominioId) {
      return res.status(400).json({ error: 'No autorizado' });
    }

    const { idA, idB, nuevoNumero } = req.body;

    const propA = await prisma.propiedad.findFirst({ where: { id: idA, condominioId: userCondominioId } });
    const propB = await prisma.propiedad.findFirst({ where: { id: idB, condominioId: userCondominioId } });

    if (!propA || !propB) {
      return res.status(404).json({ error: 'Uno o ambos inmuebles no existen.' });
    }

    // Calcular metraje y alícuotas combinados
    const m2Total = (propA.m2 || 0) + (propB.m2 || 0);
    const alicuotaTotal = (propA.alicuota || 0) + (propB.alicuota || 0);
    const cuotaFijaTotal = (propA.cuotaFija || 0) + (propB.cuotaFija || 0);
    
    // Asignar el precioM2 del inmueble principal (A) o un promedio. Tomaremos el de A por defecto.
    const precioM2Base = propA.precioM2 || 0;

    // Ejecutar fusión en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Reasignar cualquier residente de B a A
      await tx.residente.updateMany({
        where: { propiedadId: idB },
        data: { propiedadId: idA }
      });
      // 2. Reasignar avisos de cobro
      await tx.avisoCobro.updateMany({
        where: { propiedadId: idB },
        data: { propiedadId: idA }
      });
      // 3. Reasignar inspecciones
      await tx.inspeccion.updateMany({
        where: { propiedadId: idB },
        data: { propiedadId: idA }
      });
      // 4. Reasignar familias
      await tx.familia.updateMany({
        where: { propiedadId: idB },
        data: { propiedadId: idA }
      });
      // 5. Eliminar propiedad B
      await tx.propiedad.delete({ where: { id: idB } });
      // 6. Actualizar propiedad A con la suma
      await tx.propiedad.update({
        where: { id: idA },
        data: {
          numero: nuevoNumero || `${propA.numero}-${propB.numero.replace(/\D/g,'')}`, // ej: Apto 301-302
          m2: m2Total,
          alicuota: alicuotaTotal,
          cuotaFija: cuotaFijaTotal,
          precioM2: precioM2Base
        }
      });
    });

    res.json({ success: true, message: 'Inmuebles fusionados correctamente.' });
  } catch (error) {
    console.error('Error fusionando inmuebles:', error);
    res.status(500).json({ error: 'No se pudieron fusionar los inmuebles. Verifique que no existan conflictos de datos.' });
  }
});

export default router;
