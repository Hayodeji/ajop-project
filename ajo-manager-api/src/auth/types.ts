import type { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  // Minimal shape for authenticated user; many places read `user.id` and `user.phone`
  user: { id?: string; userId?: string; phone?: string; role?: string; [key: string]: any }
}
