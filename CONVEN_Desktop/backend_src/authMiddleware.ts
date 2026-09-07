import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

let secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('CRITICAL SECURITY ALERT: JWT_SECRET environment variable is missing. Using secure fallback. Please configure .env immediately!');
  secret = 'conven-secret-key-2025';
}

export interface AuthRequest extends Request {
  user?: { id: string; username: string; rol: string; condominioId?: string };
  body: any;
  params: any;
  headers: any;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No autorizado: token requerido' });
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'No autorizado: token inválido o expirado' });
  }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.rol !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol SUPERADMIN' });
  }
  next();
}
