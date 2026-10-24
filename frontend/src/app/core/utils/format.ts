export function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes === 0) return '0 B';

  const unidades = ['B', 'KB', 'MB', 'GB'];
  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    unidades.length - 1,
  );
  const valor = bytes / Math.pow(1024, indice);

  return `${valor.toFixed(valor >= 10 || indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const fecha = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(fecha.getTime())) return '—';

  return fecha.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—';
  const fecha = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(fecha.getTime())) return '—';

  return fecha.toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function extensionDe(nombre: string): string {
  const partes = nombre.split('.');
  return partes.length > 1 ? partes.pop()!.toLowerCase() : '';
}
