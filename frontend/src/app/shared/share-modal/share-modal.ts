import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { PermisoEntry, UsuarioResumen, usuarioId, usuarioNombre } from '../../core/models/comun.model';
import { ArchivoService } from '../../core/services/archivo.service';
import { AuthService } from '../../core/services/auth.service';
import { CarpetaService } from '../../core/services/carpeta.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { extractHttpError } from '../../core/utils/http-error';
import {
  NIVELES_ACCESO,
  NivelAcceso,
  nivelDeEntrada,
  permisosDeNivel,
} from '../../core/utils/permisos';

export type TipoRecursoCompartido = 'archivo' | 'carpeta';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  templateUrl: './share-modal.html',
})
export class ShareModal implements OnDestroy {
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly usuarioService = inject(UsuarioService);
  readonly auth = inject(AuthService);

  readonly tipo = input.required<TipoRecursoCompartido>();
  readonly recursoId = input.required<string>();
  readonly recursoNombre = input<string>('');
  readonly closed = output<void>();
  readonly changed = output<void>();

  readonly niveles = NIVELES_ACCESO;
  readonly shareWith = signal<PermisoEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');
  readonly resultados = signal<UsuarioResumen[]>([]);
  readonly buscando = signal(false);
  readonly seleccionados = signal<UsuarioResumen[]>([]);
  readonly nivel = signal<NivelAcceso>('read');
  readonly guardando = signal(false);
  readonly mensaje = signal('');
  readonly errorAccion = signal('');

  readonly compartidosIds = computed(
    () => new Set(this.shareWith().map((entry) => usuarioId(entry.user))),
  );

  readonly resultadosDisponibles = computed(() =>
    this.resultados().filter(
      (usuario) =>
        !this.compartidosIds().has(usuario._id) &&
        !this.seleccionados().some((item) => item._id === usuario._id),
    ),
  );

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const id = this.recursoId();
      const tipo = this.tipo();
      if (!id) return;
      this.cargar(id, tipo);
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  cargar(
    id = this.recursoId(),
    tipo = this.tipo(),
  ): void {
    this.loading.set(true);
    this.error.set('');

    const peticion =
      tipo === 'archivo'
        ? this.archivoService.comparticiones(id)
        : this.carpetaService.comparticiones(id);

    peticion.subscribe({
      next: (recurso) => {
        this.shareWith.set(recurso.shareWith ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          extractHttpError(err, 'No se pudieron cargar las comparticiones'),
        );
        this.loading.set(false);
      },
    });
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
    this.mensaje.set('');
    this.errorAccion.set('');

    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (value.trim().length < 2) {
      this.resultados.set([]);
      return;
    }

    this.searchTimer = setTimeout(() => this.buscar(), 300);
  }

  buscar(): void {
    const termino = this.busqueda().trim();
    if (termino.length < 2) {
      this.resultados.set([]);
      return;
    }

    this.buscando.set(true);
    this.usuarioService
      .buscar(termino, this.auth.user()?.id)
      .subscribe({
        next: (usuarios) => {
          this.resultados.set(usuarios);
          this.buscando.set(false);
        },
        error: (err) => {
          this.errorAccion.set(
            extractHttpError(err, 'No se pudieron buscar usuarios'),
          );
          this.resultados.set([]);
          this.buscando.set(false);
        },
      });
  }

  agregar(usuario: UsuarioResumen): void {
    if (this.seleccionados().some((item) => item._id === usuario._id)) return;
    this.seleccionados.update((items) => [...items, usuario]);
    this.mensaje.set('');
    this.errorAccion.set('');
  }

  quitarSeleccionado(id: string): void {
    this.seleccionados.update((items) => items.filter((item) => item._id !== id));
  }

  compartir(): void {
    const seleccionados = this.seleccionados();
    if (!seleccionados.length) return;

    this.guardando.set(true);
    this.errorAccion.set('');
    this.mensaje.set('');

    const peticion =
      this.tipo() === 'archivo'
        ? this.archivoService.compartirVarios(
            this.recursoId(),
            seleccionados.map((usuario) => ({
              userId: usuario._id,
              nivel: this.nivel(),
            })),
          )
        : this.carpetaService.compartirVarios(
            this.recursoId(),
            seleccionados.map((usuario) => ({
              userId: usuario._id,
              nivel: this.nivel(),
            })),
          );

    peticion.subscribe({
      next: (recurso) => {
        this.shareWith.set(recurso.shareWith ?? []);
        this.seleccionados.set([]);
        this.resultados.set([]);
        this.busqueda.set('');
        this.guardando.set(false);
        this.mensaje.set(
          `Se compartió con ${seleccionados.length} usuario(s) correctamente.`,
        );
        this.changed.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorAccion.set(
          extractHttpError(err, 'No se pudo compartir el recurso'),
        );
      },
    });
  }

  cambiarNivel(entry: PermisoEntry, value: string): void {
    const userId = usuarioId(entry.user);
    if (!userId) return;

    const nivel = value as NivelAcceso;
    this.errorAccion.set('');
    this.mensaje.set('');

    const peticion =
      this.tipo() === 'archivo'
        ? this.archivoService.actualizarPermiso(
            this.recursoId(),
            userId,
            permisosDeNivel(nivel),
          )
        : this.carpetaService.actualizarPermiso(
            this.recursoId(),
            userId,
            permisosDeNivel(nivel),
          );

    peticion.subscribe({
      next: (recurso) => {
        this.shareWith.set(recurso.shareWith ?? []);
        this.mensaje.set('Permiso actualizado.');
        this.changed.emit();
      },
      error: (err) => {
        this.errorAccion.set(
          extractHttpError(err, 'No se pudo actualizar el permiso'),
        );
        this.cargar();
      },
    });
  }

  revocar(entry: PermisoEntry): void {
    const userId = usuarioId(entry.user);
    if (!userId) return;

    if (!confirm(`¿Revocar el acceso de ${usuarioNombre(entry.user)}?`)) return;

    this.errorAccion.set('');
    this.mensaje.set('');

    const peticion =
      this.tipo() === 'archivo'
        ? this.archivoService.revocarPermiso(this.recursoId(), userId)
        : this.carpetaService.revocarPermiso(this.recursoId(), userId);

    peticion.subscribe({
      next: (recurso) => {
        this.shareWith.set(recurso.shareWith ?? []);
        this.mensaje.set('Permiso revocado.');
        this.changed.emit();
      },
      error: (err) =>
        this.errorAccion.set(
          extractHttpError(err, 'No se pudo revocar el permiso'),
        ),
    });
  }

  nivelActual(entry: PermisoEntry): NivelAcceso {
    return nivelDeEntrada(entry);
  }

  nombre(usuario: UsuarioResumen | string | null | undefined): string {
    return usuarioNombre(usuario);
  }

  username(usuario: UsuarioResumen | string | null | undefined): string {
    if (!usuario || typeof usuario === 'string') return '';
    return usuario.username ?? '';
  }

  iniciales(usuario: UsuarioResumen): string {
    return `${usuario.name?.[0] ?? ''}${usuario.lastname?.[0] ?? ''}`.toUpperCase() ||
      usuario.username.slice(0, 2).toUpperCase();
  }

  cerrar(): void {
    if (this.guardando()) return;
    this.closed.emit();
  }
}
