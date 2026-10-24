import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchivoDetalle } from '../core/models/archivo.model';
import { usuarioId, usuarioNombre } from '../core/models/comun.model';
import { ArchivoService } from '../core/services/archivo.service';
import { AuthService } from '../core/services/auth.service';
import { CarpetaService } from '../core/services/carpeta.service';
import { extractHttpError } from '../core/utils/http-error';
import { formatBytes, formatDate } from '../core/utils/format';
import { Comentarios } from '../comentarios/comentarios';
import { InfoItem, InfoModal } from '../shared/info-modal/info-modal';
import { MoveModal } from '../shared/move-modal/move-modal';
import { RenameModal } from '../shared/rename-modal/rename-modal';
import { ShareModal } from '../shared/share-modal/share-modal';

@Component({
  selector: 'app-archivos',
  standalone: true,
  imports: [
    RouterLink,
    InfoModal,
    Comentarios,
    ShareModal,
    RenameModal,
    MoveModal,
  ],
  templateUrl: './archivos.html',
  styleUrl: './archivos.css',
})
export class Archivos implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly auth = inject(AuthService);

  readonly archivo = signal<ArchivoDetalle | null>(null);
  readonly ruta = signal<Array<{ _id: string; name: string }>>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly draft = signal('');
  readonly infoItem = signal<InfoItem | null>(null);
  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  readonly canEdit = computed(() => {
    const permiso = this.archivo()?.permiso;
    return permiso === 'owner' || permiso === 'edit';
  });

  readonly canComment = computed(() => {
    const permiso = this.archivo()?.permiso;
    return (
      permiso === 'owner' ||
      permiso === 'edit' ||
      permiso === 'comment'
    );
  });

  readonly isOwner = computed(
    () => usuarioId(this.archivo()?.owner) === this.auth.user()?.id,
  );

  readonly shareTarget = signal<{ id: string; name: string } | null>(null);
  readonly renameOpen = signal(false);
  readonly moveOpen = signal(false);

  readonly dirty = computed(
    () => this.archivo() !== null && this.draft() !== (this.archivo()?.content ?? ''),
  );

  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  load(id = this.route.snapshot.params['id']): void {
    this.loading.set(true);
    this.error.set('');
    this.editing.set(false);

    this.archivoService.findOne(id).subscribe({
      next: (archivo) => {
        this.archivo.set(archivo);
        this.draft.set(archivo.content ?? '');
        this.cargarRuta(archivo.parentFolder);
        this.loading.set(false);
      },
      error: (err) => {
        this.ruta.set([]);
        this.error.set(extractHttpError(err, 'No se pudo cargar el archivo'));
        this.loading.set(false);
      },
    });
  }

  toggleEdit(): void {
    if (!this.canEdit()) return;

    if (!this.editing()) {
      this.draft.set(this.archivo()?.content ?? '');
      this.editing.set(true);
      return;
    }

    this.editing.set(false);
    this.draft.set(this.archivo()?.content ?? '');
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.draft.set(this.archivo()?.content ?? '');
  }

  save(): void {
    const archivo = this.archivo();
    if (!archivo || !this.canEdit()) return;

    this.saving.set(true);

    this.archivoService.update(archivo._id, { content: this.draft() }).subscribe({
      next: (updated) => {
        this.archivo.set({
          ...archivo,
          content: updated.content ?? this.draft(),
          size: updated.size,
          updatedAt: updated.updatedAt,
          name: updated.name,
          type: updated.type,
        });
        this.editing.set(false);
        this.saving.set(false);
        this.showToast('Cambios guardados correctamente', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.showToast(
          extractHttpError(err, 'No se pudieron guardar los cambios'),
          'error',
        );
      },
    });
  }

  descargar(): void {
    const archivo = this.archivo();
    if (!archivo) return;

    this.archivoService.descargar(archivo._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = archivo.name;
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('Descarga iniciada', 'success');
      },
      error: (err) =>
        this.showToast(extractHttpError(err, 'No se pudo descargar'), 'error'),
    });
  }

  back(): void {
    const parent = this.archivo()?.parentFolder;
    void this.router.navigate(parent ? ['/carpetas', parent] : ['/']);
  }

  private cargarRuta(parentFolder: string | null): void {
    if (!parentFolder) {
      this.ruta.set([]);
      return;
    }

    this.carpetaService.contenido(parentFolder).subscribe({
      next: (contenido) =>
        this.ruta.set([
          ...(contenido.ruta ?? []),
          { _id: contenido.carpeta._id, name: contenido.carpeta.name },
        ]),
      error: () => this.ruta.set([]),
    });
  }

  showInfo(): void {
    const archivo = this.archivo();
    if (!archivo) return;

    this.infoItem.set({
      name: archivo.name,
      kind: 'archivo',
      type: archivo.type,
      createdAt: archivo.createdAt,
      updatedAt: archivo.updatedAt,
      size: archivo.size,
      owner: usuarioNombre(archivo.owner),
    });
  }

  size(bytes: number | undefined): string {
    return formatBytes(bytes);
  }

  date(value?: string): string {
    return formatDate(value);
  }

  ownerName(): string {
    return usuarioNombre(this.archivo()?.owner);
  }

  openShare(): void {
    const archivo = this.archivo();
    if (!archivo || !this.isOwner()) return;
    this.shareTarget.set({ id: archivo._id, name: archivo.name });
  }

  openRename(): void {
    if (!this.archivo() || !this.isOwner()) return;
    this.renameOpen.set(true);
  }

  openMove(): void {
    if (!this.archivo() || !this.isOwner()) return;
    this.moveOpen.set(true);
  }

  onRenamed(): void {
    this.renameOpen.set(false);
    this.showToast('Archivo renombrado correctamente', 'success');
    this.load();
  }

  onMoved(): void {
    this.moveOpen.set(false);
    this.showToast('Archivo movido correctamente', 'success');
    this.load();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }
}
