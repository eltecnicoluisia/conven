import { Request, Response, NextFunction } from 'express';

/**
 * Heurística simple para detectar garabatos o textos sin sentido.
 * Retorna true si es garabato (inválido), false si parece normal.
 */
function esGarabato(texto: string): boolean {
  if (!texto || typeof texto !== 'string') return false;
  
  // Ignoramos cadenas cortas o números puros (ej: ids, montos)
  if (texto.length < 4 || !isNaN(Number(texto))) return false;

  // 1. Verificar si hay 4 o más caracteres idénticos consecutivos (ej: aaaa, 11111)
  if (/(.)\1{3,}/.test(texto)) return true;

  // 2. Si la palabra tiene más de 4 letras, pero no tiene ninguna vocal, probablemente es garabato (ej: asdfgh)
  const palabras = texto.split(/\s+/);
  for (const palabra of palabras) {
    if (palabra.length > 4 && !/[aeiouáéíóúAEIOUÁÉÍÓÚ]/i.test(palabra) && /^[a-zA-Z]+$/.test(palabra)) {
      return true;
    }
  }

  // 3. Proporción alta de símbolos especiales (más del 40% de símbolos raros)
  const simbolosRaros = (texto.match(/[^a-zA-Z0-9\s.,-]/g) || []).length;
  if (simbolosRaros > 0 && (simbolosRaros / texto.length) > 0.4) {
    return true;
  }

  return false;
}

/**
 * Middleware para Express que intercepta el Body y valida strings
 */
export const antiGarabatosMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      // Ignorar campos de IDs, emails, contraseñas o tokens
      if (key.toLowerCase().endsWith('id') || key === 'id' || key === 'email' || key === 'password' || key === 'token') {
        continue;
      }
      if (typeof value === 'string') {
        if (esGarabato(value)) {
           console.log("GARABATO DETECTADO:", { key, value });
           res.status(400).json({
            error: 'GarabatoDetectado',
            message: `El texto ingresado en el campo '${key}' parece ser inválido o no tiene sentido. Por favor ingrese datos reales.`
          });
          return;
        }
      }
    }
  }
  next();
};
