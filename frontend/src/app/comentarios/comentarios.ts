import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Comentario } from '../core/models/comentario.model';
import { usuarioId, usuarioNombre } from '../core/models/comun.model';
import { AuthService } from '../core/services/auth.service';
import {
  ComentarioService,
  TipoComentario,
} from '../core/services/comentario.service';
import { extractHttpError } from '../core/utils/http-error';
import { formatDateTime } from '../core/utils/format';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css',
})
export class Comentarios implements OnDestroy {
  private readonly comentarioService = inject(ComentarioService);
  readonly auth = inject(AuthService);

  readonly tipo = input.required<TipoComentario>();
  readonly recursoId = input.required<string>();
  readonly canComment = input(false);

  readonly visible = signal(false);
  readonly items = signal<Comentario[]>([]);
  readonly loaded = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly texto = signal('');
  readonly enviando = signal(false);
  readonly accionError = signal('');
  readonly aviso = signal('');
  readonly reportados = computed(
    () => this.items().filter((item) => item.isReported).length,
  );

  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      this.tipo();
      this.recursoId();
      this.visible.set(false);
      this.items.set([]);
      this.loaded.set(false);
      this.error.set('');
      this.accionError.set('');
      this.aviso.set('');
      this.texto.set('');
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  toggle(): void {
    const abrir = !this.visible();
    this.visible.set(abrir);

    if (abrir && !this.loaded()) this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.comentarioService.listar(this.tipo(), this.recursoId()).subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          extractHttpError(err, 'No se pudieron cargar los comentarios'),
        );
        this.loading.set(false);
      },
    });
  }

  crear(): void {
    const texto = this.texto().trim();
    if (!texto || this.enviando()) return;

    this.enviando.set(true);
    this.accionError.set('');
    this.aviso.set('');

    this.comentarioService
      .crear(this.tipo(), this.recursoId(), texto)
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.texto.set('');
          this.aviso.set('Comentario publicado.');
          this.load();
          this.autoOcultarAviso();
        },
        error: (err) => {
          this.enviando.set(false);
          this.accionError.set(
            extractHttpError(err, 'No se pudo publicar el comentario'),
          );
        },
      });
  }

  reportar(comentario: Comentario): void {
    if (comentario.isReported) return;
    if (
      !confirm(
        '¿Reportar este comentario? Se notificará a los administradores.',
      )
    )
      return;

    this.accionError.set('');
    this.aviso.set('');

    this.comentarioService
      .reportar(this.tipo(), this.recursoId(), comentario._id)
      .subscribe({
        next: () => {
          this.items.update((items) =>
            items.map((item) =>
              item._id === comentario._id
                ? { ...item, isReported: true }
                : item,
            ),
          );
          this.aviso.set('Comentario reportado. Se notificó a los administradores.');
          this.autoOcultarAviso();
        },
        error: (err) =>
          this.accionError.set(
            extractHttpError(err, 'No se pudo reportar el comentario'),
          ),
      });
  }

  autor(comentario: Comentario): string {
    return usuarioNombre(comentario.user);
  }

  username(comentario: Comentario): string {
    if (typeof comentario.user === 'string') return '';
    return comentario.user.username ?? '';
  }

  esMio(comentario: Comentario): boolean {
    return usuarioId(comentario.user) === this.auth.user()?.id;
  }

  iniciales(comentario: Comentario): string {
    if (typeof comentario.user === 'string') {
      return comentario.user.slice(0, 2).toUpperCase();
    }

    const nombre = `${comentario.user.name?.[0] ?? ''}${comentario.user.lastname?.[0] ?? ''}`;
    return nombre.trim().toUpperCase() || comentario.user.username.slice(0, 2).toUpperCase();
  }

  fecha(value: string | null | undefined): string {
    return formatDateTime(value);
  }

  private autoOcultarAviso(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.aviso.set(''), 4000);
  }
}
