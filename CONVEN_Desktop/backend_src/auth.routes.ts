import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from './authMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'conven-secret-key-2025';

function validarPasswordEstricta(password: string): boolean {
  if (!password || password.length !== 10) return false;
  const letras = password.replace(/[^A-Za-z]/g, '').length;
  const numeros = password.replace(/[^0-9]/g, '').length;
  // Debe tener exactamente 6 letras y 4 números, y sumar 10.
  // Si tiene símbolos, `letras + numeros` no será 10.
  if (letras === 6 && numeros === 4 && (letras + numeros === password.length)) {
    return true;
  }
  return false;
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const usuario = await (prisma as any).usuario.findUnique({ where: { username } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' });
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol, condominioId: usuario.condominioId },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        condominioId: usuario.condominioId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, nombreEdificio, telefono, preguntas } = req.body;
    if (!username || !email || !password || !nombreEdificio || !telefono || !preguntas || preguntas.length !== 3) {
      return res.status(400).json({ error: 'Todos los campos son requeridos, incluyendo 3 preguntas de seguridad' });
    }
    if (!validarPasswordEstricta(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener exactamente 6 letras del alfabeto y 4 números, sumando 10 caracteres en total, sin símbolos ni caracteres especiales.' });
    }

    const existente = await (prisma as any).usuario.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existente) {
      return res.status(400).json({ error: 'El documento (V/J) o email ya están registrados' });
    }

    // Crear el Condominio y luego el Usuario
    const nuevoCondominio = await (prisma as any).condominio.create({
      data: {
        nombre: nombreEdificio,
        rif: username, // Se usa el documento del usuario como RIF principal
        telefono: telefono
      }
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await (prisma as any).usuario.create({
      data: {
        username,
        email,
        passwordHash,
        rol: 'CONDOMINIO',
        activo: true,
        condominioId: nuevoCondominio.id,
        telefono,
        pregunta1: preguntas[0].pregunta,
        respuesta1: preguntas[0].respuesta.toLowerCase().trim(),
        pregunta2: preguntas[1].pregunta,
        respuesta2: preguntas[1].respuesta.toLowerCase().trim(),
        pregunta3: preguntas[2].pregunta,
        respuesta3: preguntas[2].respuesta.toLowerCase().trim(),
      }
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor al registrar' });
  }
});

// POST /api/auth/recover
router.post('/recover', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Usuario (Cédula/RIF) es requerido' });

    const usuario = await (prisma as any).usuario.findUnique({ where: { username } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    if (!usuario.pregunta1 || !usuario.pregunta2 || !usuario.pregunta3) {
      return res.status(400).json({ error: 'Este usuario no tiene preguntas de seguridad configuradas. Contacte al administrador.' });
    }

    res.json({
      preguntas: [usuario.pregunta1, usuario.pregunta2, usuario.pregunta3]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al solicitar recuperación' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { username, respuestas, newPassword } = req.body;
    if (!username || !respuestas || respuestas.length !== 3 || !newPassword) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (!validarPasswordEstricta(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener exactamente 6 letras y 4 números.' });
    }

    const usuario = await (prisma as any).usuario.findUnique({ where: { username } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (
      usuario.respuesta1 !== respuestas[0].toLowerCase().trim() ||
      usuario.respuesta2 !== respuestas[1].toLowerCase().trim() ||
      usuario.respuesta3 !== respuestas[2].toLowerCase().trim()
    ) {
      return res.status(401).json({ error: 'Una o más respuestas de seguridad son incorrectas' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await (prisma as any).usuario.update({
      where: { id: usuario.id },
      data: { passwordHash }
    });

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error restableciendo contraseña' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const usuario = await (prisma as any).usuario.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, email: true, rol: true, condominioId: true, activo: true, creadoEn: true }
    });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo datos del usuario' });
  }
});

// POST /api/auth/cambiar-password (desde sesión)
router.post('/cambiar-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'Se requieren ambas contraseñas' });
    }
    
    // Si es SUPERADMIN, tal vez no obliguemos la misma regla estricta, pero para consistencia sí:
    if (!validarPasswordEstricta(passwordNueva)) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener exactamente 6 letras y 4 números.' });
    }

    const usuario = await (prisma as any).usuario.findUnique({ where: { id: req.user!.id } });
    const passwordOk = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await (prisma as any).usuario.update({
      where: { id: req.user!.id },
      data: { passwordHash }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error cambiando contraseña' });
  }
});

export default router;
