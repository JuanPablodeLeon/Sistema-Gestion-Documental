import { PermisoEntry } from '../models/comun.model';

export type NivelAcceso = 'read' | 'read_comment' | 'edit' | 'edit_comment';
export type PermisoBase = 'read' | 'comment' | 'edit';

export interface OpcionNivel {
  value: NivelAcceso;
  label: string;
  descripcion: string;
  permissions: PermisoBase[];
}

export const NIVELES_ACCESO: OpcionNivel[] = [
  {
    value: 'read',
    label: 'Lectura',
    descripcion: 'Puede ver y descargar el recurso.',
    permissions: ['read'],
  },
  {
    value: 'read_comment',
    label: 'Lectura y comentario',
    descripcion: 'Puede ver, descargar y comentar.',
    permissions: ['read', 'comment'],
  },
  {
    value: 'edit',
    label: 'Escritura',
    descripcion: 'Puede ver y modificar el contenido.',
    permissions: ['edit'],
  },
  {
    value: 'edit_comment',
    label: 'Escritura y comentario',
    descripcion: 'Puede ver, modificar y comentar.',
    permissions: ['edit', 'comment'],
  },
];

export function nivelDesdePermisos(permissions: PermisoBase[]): NivelAcceso {
  const edit = permissions.includes('edit');
  const comment = permissions.includes('comment');

  if (edit && comment) return 'edit_comment';
  if (edit) return 'edit';
  if (comment) return 'read_comment';
  return 'read';
}

export function nivelLabel(nivel: NivelAcceso): string {
  return NIVELES_ACCESO.find((opcion) => opcion.value === nivel)?.label ?? nivel;
}

export function nivelDeEntrada(entry: PermisoEntry): NivelAcceso {
  return nivelDesdePermisos(entry.permissions);
}

export function permisosDeNivel(nivel: NivelAcceso): PermisoBase[] {
  return [
    ...(NIVELES_ACCESO.find((opcion) => opcion.value === nivel)?.permissions ??
      []),
  ];
}
