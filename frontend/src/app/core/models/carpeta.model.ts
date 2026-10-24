import { Archivo } from './archivo.model';
import {
  ListaResponse,
  PermisoEfectivo,
  PermisoEntry,
  UsuarioResumen,
} from './comun.model';

export interface Carpeta {
  _id: string;
  name: string;
  parentFolder: string | null;
  ancestors: string[];
  size: number;
  owner: UsuarioResumen | string;
  shareWith?: PermisoEntry[];
  comentarios?: unknown[];
  inTrash: boolean;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RutaCarpeta {
  _id: string;
  name: string;
}

export interface ContenidoCarpeta {
  carpeta: Carpeta;
  subcarpetas: Carpeta[];
  archivos: Archivo[];
  ruta: RutaCarpeta[];
  permiso: PermisoEfectivo;
}

export type ListaCarpetas = ListaResponse<Carpeta>;
