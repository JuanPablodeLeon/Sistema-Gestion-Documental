export interface UsuarioResumen {
  _id: string;
  username: string;
  name?: string;
  lastname?: string;
  status?: boolean;
}

export type PermisoEfectivo = 'owner' | 'read' | 'comment' | 'edit' | null;

export interface PermisoEntry {
  user: UsuarioResumen | string;
  permissions: Array<'read' | 'comment' | 'edit'>;
}

export interface ListaResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function usuarioId(user: UsuarioResumen | string | undefined | null): string {
  if (!user) return '';
  return typeof user === 'string' ? user : user._id;
}

export function usuarioNombre(
  user: UsuarioResumen | string | undefined | null,
): string {
  if (!user) return 'Desconocido';
  if (typeof user === 'string') return user;
  return `${user.name ?? ''} ${user.lastname ?? ''}`.trim() || user.username;
}
