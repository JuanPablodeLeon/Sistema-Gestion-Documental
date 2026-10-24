import { UsuarioResumen } from './comun.model';

export interface Comentario {
  _id: string;
  user: UsuarioResumen | string;
  texto: string;
  isReported: boolean;
  reportedBy?: UsuarioResumen | string | null;
  reportedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ComentarioReportado {
  comentarioId: string;
  texto: string;
  autor: UsuarioResumen | string | null;
  reportadoPor: UsuarioResumen | string | null;
  reportadoEn: string | null;
  creadoEn: string | null;
  recursoId: string;
  recursoNombre: string;
  tipoRecurso: 'archivo' | 'carpeta';
  tipo: string | null;
  propietario: UsuarioResumen | string | null;
}
