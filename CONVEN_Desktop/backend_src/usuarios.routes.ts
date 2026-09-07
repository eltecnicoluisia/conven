import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import { authMiddleware, requireSuperAdmin, AuthRequest } from './authMiddleware';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authMiddleware);

// GET /api/usuarios — Lista todos (solo SUPERADMIN)
router.get('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const usuarios = await (prisma as any).usuario.findMany({
      select: { id: true, username: true, email: true, rol: true, condominioId: true, activo: true, creadoEn: true }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// POST /api/usuarios — Crea nuevo usuario (solo SUPERADMIN)
router.post('/', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, rol, condominioId } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email y password son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existente = await (prisma as any).usuario.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existente) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevo = await (prisma as any).usuario.create({
      data: {
        username,
        email,
        passwordHash,
        rol: rol || 'CONDOMINIO',
        condominioId: condominioId || null,
        activo: true
      },
      select: { id: true, username: true, email: true, rol: true, condominioId: true, activo: true, creadoEn: true }
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

// PUT /api/usuarios/:id — Edita usuario (solo SUPERADMIN)
router.put('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, rol, condominioId, activo, password } = req.body;
    const data: any = {};
    if (username) data.username = username;
    if (email) data.email = email;
    if (rol) data.rol = rol;
    if (condominioId !== undefined) data.condominioId = condominioId || null;
    if (activo !== undefined) data.activo = activo;
    if (password && password.length >= 6) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await (prisma as any).usuario.update({
      where: { id: req.params.id },
      data,
      select: { id: true, username: true, email: true, rol: true, condominioId: true, activo: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

// DELETE /api/usuarios/:id — Desactiva usuario (solo SUPERADMIN)
router.delete('/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await (prisma as any).usuario.update({
      where: { id: req.params.id },
      data: { activo: false }
    });
    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error desactivando usuario' });
  }
});

export default router;
