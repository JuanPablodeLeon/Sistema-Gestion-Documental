const ACCIONES: Record<string, string> = {
  usuario_creado: 'Usuario creado',
  usuario_actualizado: 'Usuario actualizado',
  usuario_desactivado: 'Usuario desactivado',
  carpeta_creada: 'Carpeta creada',
  carpeta_renombrada: 'Carpeta renombrada',
  carpeta_movida: 'Carpeta movida',
  carpeta_enviada_papelera: 'Carpeta enviada a papelera',
  carpeta_restaurada: 'Carpeta restaurada',
  carpeta_eliminada: 'Carpeta eliminada',
  archivo_creado: 'Archivo creado',
  archivo_actualizado: 'Archivo actualizado',
  archivo_renombrado: 'Archivo renombrado',
  archivo_movido: 'Archivo movido',
  archivo_descargado: 'Archivo descargado',
  archivo_enviado_papelera: 'Archivo enviado a papelera',
  archivo_restaurado: 'Archivo restaurado',
  archivo_eliminado: 'Archivo eliminado',
  recurso_compartido: 'Recurso compartido',
  permiso_modificado: 'Permiso modificado',
  permiso_revocado: 'Permiso revocado',
  comentario_creado: 'Comentario creado',
  comentario_eliminado: 'Comentario eliminado',
  comentario_reportado: 'Comentario reportado',
};

const RECURSOS: Record<string, string> = {
  usuario: 'Usuario',
  carpeta: 'Carpeta',
  archivo: 'Archivo',
  comentario: 'Comentario',
  permiso: 'Permiso',
};

export function accionLabel(accion: string): string {
  return ACCIONES[accion] ?? accion.replaceAll('_', ' ');
}

export function recursoLabel(recurso: string): string {
  return RECURSOS[recurso] ?? recurso;
}

export function accionEsCreacion(accion: string): boolean {
  return accion.endsWith('_creado') || accion.endsWith('_creada');
}

export function accionEsEliminacion(accion: string): boolean {
  return accion.endsWith('_eliminado') || accion.endsWith('_eliminada');
}

export function accionEsPapelera(accion: string): boolean {
  return accion.includes('papelera');
}

export function accionEsModificacion(accion: string): boolean {
  return (
    accion.includes('actualizado') ||
    accion.includes('renombrado') ||
    accion.includes('movido') ||
    accion.includes('compartido') ||
    accion.includes('permiso')
  );
}
