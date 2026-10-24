import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Actividad } from '../core/models/actividad.model';
import {
  UsuarioResumen,
  usuarioNombre,
} from '../core/models/comun.model';
import {
  ActividadPorPeriodo,
  ActividadPorTipo,
  ArchivoMasCompartido,
  ArchivoMasOperaciones,
  ArchivosPorRango,
  ArchivosPorTipo,
  RecursoCompartido,
  RecursoRecibido,
  ReporteUsuario,
  TopUsuarioArchivos,
  UsuarioMasCompartidos,
} from '../core/models/reporte.model';
import { AuthService } from '../core/services/auth.service';
import { ReporteService } from '../core/services/reporte.service';
import { accionLabel, recursoLabel } from '../core/utils/actividad';
import { formatBytes, formatDate, formatDateTime } from '../core/utils/format';
import { extractHttpError } from '../core/utils/http-error';

type Tab = 'archivos' | 'usuarios' | 'comparticion' | 'actividad';
type UnidadPeriodo = 'dia' | 'mes' | 'anio';

function isoDate(fecha: Date): string {
  const offset = fecha.getTimezoneOffset();
  return new Date(fecha.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function daysAgo(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return isoDate(fecha);
}

function today(): string {
  return isoDate(new Date());
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  readonly auth = inject(AuthService);
  private readonly reporteService = inject(ReporteService);

  readonly tab = signal<Tab>('archivos');
  readonly loading = signal(true);
  readonly error = signal('');

  readonly usuarios = signal<ReporteUsuario[]>([]);
  readonly usuarioSeleccionado = signal('');
  readonly desdeArchivos = signal(daysAgo(60));
  readonly hastaArchivos = signal(today());
  readonly desdeActividad = signal(daysAgo(60));
  readonly hastaActividad = signal(today());
  readonly unidadPeriodo = signal<UnidadPeriodo>('mes');

  readonly porTipo = signal<ArchivosPorTipo[]>([]);
  readonly rangoArchivos = signal<ArchivosPorRango | null>(null);
  readonly archivosOperaciones = signal<ArchivoMasOperaciones[]>([]);
  readonly topUsuarios = signal<TopUsuarioArchivos[]>([]);
  readonly usuariosCompartidos = signal<UsuarioMasCompartidos[]>([]);
  readonly archivosCompartidos = signal<ArchivoMasCompartido[]>([]);
  readonly compartidosPorUsuario = signal<RecursoCompartido[]>([]);
  readonly recibidosPorUsuario = signal<RecursoRecibido[]>([]);
  readonly historial = signal<Actividad[]>([]);
  readonly actividadTipo = signal<ActividadPorTipo[]>([]);
  readonly actividadPeriodo = signal<ActividadPorPeriodo[]>([]);
  readonly principales = signal<ActividadPorTipo[]>([]);

  readonly cargandoRangoArchivos = signal(false);
  readonly cargandoUsuario = signal(false);
  readonly cargandoHistorial = signal(false);
  readonly cargandoPeriodo = signal(false);
  readonly errorRangoArchivos = signal('');
  readonly errorUsuario = signal('');
  readonly errorHistorial = signal('');
  readonly errorPeriodo = signal('');

  readonly totalArchivos = computed(() =>
    this.porTipo().reduce((total, item) => total + item.cantidad, 0),
  );
  readonly totalComparticiones = computed(() =>
    this.usuariosCompartidos().reduce(
      (total, item) => total + item.comparticiones,
      0,
    ),
  );
  readonly totalActividades = computed(() =>
    this.actividadTipo().reduce((total, item) => total + item.cantidad, 0),
  );
  readonly maxPorTipo = computed(() =>
    Math.max(1, ...this.porTipo().map((item) => item.cantidad)),
  );
  readonly maxOperaciones = computed(() =>
    Math.max(1, ...this.archivosOperaciones().map((item) => item.operaciones)),
  );
  readonly maxTopArchivos = computed(() =>
    Math.max(1, ...this.topUsuarios().map((item) => item.archivos)),
  );
  readonly maxCompartidos = computed(() =>
    Math.max(1, ...this.usuariosCompartidos().map((item) => item.comparticiones)),
  );
  readonly maxArchivoCompartido = computed(() =>
    Math.max(
      1,
      ...this.archivosCompartidos().map((item) => item.cantidadUsuarios),
    ),
  );
  readonly maxActividadTipo = computed(() =>
    Math.max(1, ...this.actividadTipo().map((item) => item.cantidad)),
  );
  readonly maxActividadPeriodo = computed(() =>
    Math.max(1, ...this.actividadPeriodo().map((item) => item.cantidad)),
  );
  readonly maxPrincipales = computed(() =>
    Math.max(1, ...this.principales().map((item) => item.cantidad)),
  );

  ngOnInit(): void {
    this.usuarioSeleccionado.set(this.auth.user()?.id ?? '');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const userId = this.usuarioSeleccionado();

    forkJoin({
      usuarios: this.reporteService.usuarios(),
      porTipo: this.reporteService.archivosPorTipo(),
      rangoArchivos: this.reporteService.archivosPorRango(
        this.desdeArchivos(),
        this.hastaArchivos(),
      ),
      archivosOperaciones: this.reporteService.archivosMasOperaciones(10),
      topUsuarios: this.reporteService.topUsuariosArchivos(10),
      usuariosCompartidos: this.reporteService.usuariosMasCompartidos(10),
      archivosCompartidos: this.reporteService.archivosMasCompartidos(10),
      compartidosPorUsuario: userId
        ? this.reporteService.recursosCompartidosPorUsuario(userId)
        : of([] as RecursoCompartido[]),
      recibidosPorUsuario: userId
        ? this.reporteService.recursosRecibidosPorUsuario(userId)
        : of([] as RecursoRecibido[]),
      historial:
        userId && this.auth.isAdmin()
          ? this.reporteService.actividadUsuario(
              userId,
              this.desdeActividad(),
              this.hastaActividad(),
            )
          : of([] as Actividad[]),
      actividadTipo: this.reporteService.actividadPorTipo(),
      actividadPeriodo: this.reporteService.actividadPorPeriodo(
        this.unidadPeriodo(),
        this.desdeActividad(),
        this.hastaActividad(),
      ),
      principales: this.reporteService.principalesAcciones(10),
    }).subscribe({
      next: (res) => {
        this.usuarios.set(res.usuarios ?? []);
        this.porTipo.set(res.porTipo ?? []);
        this.rangoArchivos.set(res.rangoArchivos ?? null);
        this.archivosOperaciones.set(res.archivosOperaciones ?? []);
        this.topUsuarios.set(res.topUsuarios ?? []);
        this.usuariosCompartidos.set(res.usuariosCompartidos ?? []);
        this.archivosCompartidos.set(res.archivosCompartidos ?? []);
        this.compartidosPorUsuario.set(res.compartidosPorUsuario ?? []);
        this.recibidosPorUsuario.set(res.recibidosPorUsuario ?? []);
        this.historial.set(res.historial ?? []);
        this.actividadTipo.set(res.actividadTipo ?? []);
        this.actividadPeriodo.set(res.actividadPeriodo ?? []);
        this.principales.set(res.principales ?? []);

        if (!this.usuarioSeleccionado() && this.usuarios().length > 0) {
          this.cargarUsuario(this.usuarios()[0]._id);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          extractHttpError(err, 'No se pudieron cargar los reportes'),
        );
        this.loading.set(false);
      },
    });
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
  }

  cambiarUsuario(id: string): void {
    this.usuarioSeleccionado.set(id);
    this.cargarUsuario(id);
  }

  cargarUsuario(id: string): void {
    if (!id) {
      this.compartidosPorUsuario.set([]);
      this.recibidosPorUsuario.set([]);
      this.historial.set([]);
      return;
    }

    this.cargandoUsuario.set(true);
    this.cargandoHistorial.set(this.auth.isAdmin());
    this.errorUsuario.set('');
    this.errorHistorial.set('');

    forkJoin({
      compartidos: this.reporteService.recursosCompartidosPorUsuario(id),
      recibidos: this.reporteService.recursosRecibidosPorUsuario(id),
      historial: this.auth.isAdmin()
        ? this.reporteService.actividadUsuario(
            id,
            this.desdeActividad(),
            this.hastaActividad(),
          )
        : of([] as Actividad[]),
    }).subscribe({
      next: (res) => {
        this.compartidosPorUsuario.set(res.compartidos ?? []);
        this.recibidosPorUsuario.set(res.recibidos ?? []);
        this.historial.set(res.historial ?? []);
        this.cargandoUsuario.set(false);
        this.cargandoHistorial.set(false);
      },
      error: (err) => {
        const mensaje = extractHttpError(
          err,
          'No se pudo cargar la información del usuario',
        );
        this.errorUsuario.set(mensaje);
        this.errorHistorial.set(mensaje);
        this.cargandoUsuario.set(false);
        this.cargandoHistorial.set(false);
      },
    });
  }

  aplicarRangoArchivos(): void {
    this.cargandoRangoArchivos.set(true);
    this.errorRangoArchivos.set('');
    this.reporteService
      .archivosPorRango(this.desdeArchivos(), this.hastaArchivos())
      .subscribe({
        next: (res) => {
          this.rangoArchivos.set(res);
          this.cargandoRangoArchivos.set(false);
        },
        error: (err) => {
          this.errorRangoArchivos.set(
            extractHttpError(err, 'No se pudo consultar el rango de fechas'),
          );
          this.cargandoRangoArchivos.set(false);
        },
      });
  }

  aplicarRangoActividad(): void {
    this.cargarUsuario(this.usuarioSeleccionado());
    this.cargarPeriodo();
  }

  cambiarUnidadPeriodo(unidad: UnidadPeriodo): void {
    this.unidadPeriodo.set(unidad);
    this.cargarPeriodo();
  }

  cargarPeriodo(): void {
    this.cargandoPeriodo.set(true);
    this.errorPeriodo.set('');
    this.reporteService
      .actividadPorPeriodo(
        this.unidadPeriodo(),
        this.desdeActividad(),
        this.hastaActividad(),
      )
      .subscribe({
        next: (res) => {
          this.actividadPeriodo.set(res ?? []);
          this.cargandoPeriodo.set(false);
        },
        error: (err) => {
          this.errorPeriodo.set(
            extractHttpError(err, 'No se pudo cargar el reporte por período'),
          );
          this.cargandoPeriodo.set(false);
        },
      });
  }

  nombreUsuario(usuario: ReporteUsuario): string {
    return (
      `${usuario.name ?? ''} ${usuario.lastname ?? ''}`.trim() ||
      usuario.username
    );
  }

  usernamePorId(id: string): string {
    return this.usuarios().find((usuario) => usuario._id === id)?.username ?? '—';
  }

  accion(valor: string): string {
    return accionLabel(valor);
  }

  recurso(valor: string): string {
    return recursoLabel(valor);
  }

  tipo(tipo: string | undefined): string {
    return tipo ? `.${tipo}` : '—';
  }

  fecha(valor?: string | Date | null): string {
    return formatDate(valor);
  }

  fechaHora(valor?: string | Date | null): string {
    return formatDateTime(valor);
  }

  tamano(valor?: number | null): string {
    return formatBytes(valor);
  }

  propietario(valor: UsuarioResumen | string | null | undefined): string {
    return usuarioNombre(valor);
  }

  permisos(valores: string[]): string {
    if (!valores?.length) return '—';
    const etiquetas: Record<string, string> = {
      read: 'Lectura',
      comment: 'Comentario',
      edit: 'Edición',
    };
    return valores.map((valor) => etiquetas[valor] ?? valor).join(' · ');
  }

  ancho(valor: number, maximo: number): number {
    if (!valor) return 0;
    return Math.max(3, Math.round((valor / Math.max(1, maximo)) * 100));
  }

  iconoActividad(item: Actividad): string {
    if (item.action.includes('papelera')) return '🗑️';
    if (item.action.includes('reportado')) return '🚩';
    if (item.action.includes('creado') || item.action.includes('creada'))
      return '✨';
    if (item.action.includes('compartido') || item.action.includes('permiso'))
      return '🔗';
    if (item.action.includes('eliminado') || item.action.includes('eliminada'))
      return '❌';
    if (item.action.includes('restaurad')) return '♻️';
    if (item.action.includes('comentario')) return '💬';
    return '📝';
  }

  rutaRecurso(tipo: string, id: string): string[] {
    return tipo === 'archivo' ? ['/archivos', id] : ['/carpetas', id];
  }
}
