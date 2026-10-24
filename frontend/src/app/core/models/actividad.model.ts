import { ListaResponse, UsuarioResumen } from './comun.model';

export interface Actividad {
  _id: string;
  user: UsuarioResumen | string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceName: string;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export type ListaActividades = ListaResponse<Actividad>;
