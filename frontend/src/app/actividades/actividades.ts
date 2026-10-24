import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Actividad } from '../core/models/actividad.model';
import { usuarioNombre } from '../core/models/comun.model';
import { ActividadService } from '../core/services/actividad.service';
import { accionLabel, recursoLabel } from '../core/utils/actividad';
import { extractHttpError } from '../core/utils/http-error';
import { formatDateTime } from '../core/utils/format';

const ACCIONES = [
  'archivo_creado',
  'archivo_actualizado',
  'archivo_renombrado',
  'archivo_movido',
  'archivo_descargado',
  'archivo_enviado_papelera',
  'archivo_restaurado',
  'archivo_eliminado',
  'carpeta_creada',
  'carpeta_renombrada',
  'carpeta_movida',
  'carpeta_enviada_papelera',
  'carpeta_restaurada',
  'carpeta_eliminada',
  'recurso_compartido',
  'permiso_modificado',
  'permiso_revocado',
  'comentario_creado',
  'comentario_eliminado',
  'comentario_reportado',
  'usuario_creado',
  'usuario_actualizado',
  'usuario_desactivado',
];

const RECURSOS = ['archivo', 'carpeta', 'comentario', 'permiso', 'usuario'];

@Component({
  selector: 'app-actividades',
  standalone: true,
  templateUrl: './actividades.html',
  styleUrl: './actividades.css',
})
export class Actividades implements OnInit {
  private readonly actividadService = inject(ActividadService);

  readonly items = signal<Actividad[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 20;
  readonly loading = signal(true);
  readonly error = signal('');

  readonly accionFiltro = signal('');
  readonly recursoFiltro = signal('');
  readonly desdeFiltro = signal('');
  readonly hastaFiltro = signal('');

  readonly acciones = ACCIONES.map((accion) => ({
    value: accion,
    label: accionLabel(accion),
  }));
  readonly recursos = RECURSOS.map((recurso) => ({
    value: recurso,
    label: recursoLabel(recurso),
  }));
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit)),
  );

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');
    this.page.set(page);

    const filtro = {
      page,
      limit: this.limit,
      action: this.accionFiltro() || undefined,
      resourceType: this.recursoFiltro() || undefined,
      desde: this.desdeFiltro() || undefined,
      hasta: this.hastaFiltro() ? `${this.hastaFiltro()}T23:59:59` : undefined,
    };

    this.actividadService.todas(filtro).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractHttpError(err, 'No se pudo cargar el historial'));
        this.loading.set(false);
      },
    });
  }

  aplicarFiltros(): void {
    this.load(1);
  }

  limpiarFiltros(): void {
    this.accionFiltro.set('');
    this.recursoFiltro.set('');
    this.desdeFiltro.set('');
    this.hastaFiltro.set('');
    this.load(1);
  }

  anterior(): void {
    if (this.page() > 1) this.load(this.page() - 1);
  }

  siguiente(): void {
    if (this.page() < this.totalPages()) this.load(this.page() + 1);
  }

  accion(item: Actividad): string {
    return accionLabel(item.action);
  }

  recurso(item: Actividad): string {
    return recursoLabel(item.resourceType);
  }

  actor(item: Actividad): string {
    return usuarioNombre(item.user);
  }

  fecha(value: string): string {
    return formatDateTime(value);
  }

  icono(item: Actividad): string {
    if (item.action.includes('papelera')) return '🗑️';
    if (item.action.includes('creado') || item.action.includes('creada')) return '✨';
    if (item.action.includes('compartido') || item.action.includes('permiso')) return '🔗';
    if (item.action.includes('eliminado') || item.action.includes('eliminada')) return '❌';
    if (item.action.includes('restaurad')) return '♻️';
    if (item.resourceType === 'comentario') return '💬';
    if (item.resourceType === 'archivo') return '📄';
    if (item.resourceType === 'carpeta') return '📁';
    if (item.resourceType === 'usuario') return '👤';
    return '🔔';
  }

  detalle(item: Actividad): string {
    const details = item.details ?? {};
    const partes: string[] = [];

    if (Array.isArray(details['campos'])) {
      partes.push(`Campos: ${details['campos'].join(', ')}`);
    }
    if (Array.isArray(details['permisos'])) {
      partes.push(`Permisos: ${details['permisos'].join(', ')}`);
    }
    if (typeof details['size'] === 'number') {
      partes.push(`Tamaño: ${details['size']} bytes`);
    }
    if (typeof details['type'] === 'string') {
      partes.push(`Tipo: .${details['type']}`);
    }
    if (details['carpetasEliminadas']) {
      partes.push(`Carpetas eliminadas: ${details['carpetasEliminadas']}`);
    }

    return partes.join(' · ');
  }
}
