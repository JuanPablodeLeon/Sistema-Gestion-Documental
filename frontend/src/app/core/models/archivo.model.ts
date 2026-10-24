import {
  ListaResponse,
  PermisoEfectivo,
  PermisoEntry,
  UsuarioResumen,
} from './comun.model';

export type TipoArchivo = 'txt' | 'md';

export interface Archivo {
  _id: string;
  name: string;
  type: TipoArchivo;
  parentFolder: string | null;
  ancestors: string[];
  size: number;
  owner: UsuarioResumen | string;
  content?: string;
  inTrash: boolean;
  isVisible: boolean;
  shareWith?: PermisoEntry[];
  comentarios?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  permiso?: PermisoEfectivo;
}

export interface ArchivoDetalle extends Archivo {
  content: string;
  permiso: PermisoEfectivo;
}

export type ListaArchivos = ListaResponse<Archivo>;
