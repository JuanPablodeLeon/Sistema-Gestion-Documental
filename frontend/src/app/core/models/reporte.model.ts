import { Actividad } from './actividad.model';
import { Archivo } from './archivo.model';
import { UsuarioResumen } from './comun.model';
import { Usuario } from './usuario.model';

export interface ArchivosPorTipo {
  tipo: string;
  cantidad: number;
  tamanioTotal: number;
}

export interface ArchivosPorRango {
  items: Archivo[];
  total: number;
  desde: string | null;
  hasta: string | null;
}

export interface ArchivoMasOperaciones {
  archivoId: string;
  nombre?: string;
  tipo?: string;
  propietario?: string;
  operaciones: number;
}

export interface TopUsuarioArchivos {
  usuarioId: string;
  username?: string;
  nombre?: string;
  archivos: number;
  tamanioTotal: number;
}

export interface UsuarioMasCompartidos {
  usuarioId: string;
  username?: string;
  nombre?: string;
  recursos: number;
  comparticiones: number;
}

export interface ArchivoMasCompartido {
  archivoId: string;
  nombre: string;
  tipo: string;
  cantidadUsuarios: number;
  propietario?: string;
}

export interface RecursoCompartido {
  recursoId: string;
  tipo: 'archivo' | 'carpeta';
  nombre: string;
  compartidoCon: number;
  creado?: string;
}

export interface RecursoRecibido {
  recursoId: string;
  tipo: 'archivo' | 'carpeta';
  nombre: string;
  propietario: UsuarioResumen | string;
  permisos: string[];
  creado?: string;
}

export interface ActividadPorTipo {
  accion: string;
  cantidad: number;
}

export interface ActividadPorPeriodo {
  periodo: string;
  cantidad: number;
}

export type ReporteUsuario = Usuario;

export type HistorialActividad = Actividad[];
