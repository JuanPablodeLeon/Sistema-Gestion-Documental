import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Archivo, TipoArchivo } from '../core/models/archivo.model';
import { Carpeta, ContenidoCarpeta } from '../core/models/carpeta.model';
import { usuarioId, usuarioNombre } from '../core/models/comun.model';
import { Comentarios } from '../comentarios/comentarios';
import { ArchivoService } from '../core/services/archivo.service';
import { AuthService } from '../core/services/auth.service';
import { CarpetaService } from '../core/services/carpeta.service';
import { TrashService } from '../core/services/trash.service';
import { extractHttpError } from '../core/utils/http-error';
import { extensionDe, formatBytes, formatDate } from '../core/utils/format';
import { InfoItem, InfoModal } from '../shared/info-modal/info-modal';
import { MoveModal } from '../shared/move-modal/move-modal';
import {
  RenameModal,
  TipoRecursoEditable,
} from '../shared/rename-modal/rename-modal';
import { ShareModal } from '../shared/share-modal/share-modal';

const MAX_UPLOAD_BYTES = 16 * 1024 * 1024;

@Component({
  selector: 'app-carpetas',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InfoModal,
    Comentarios,
    ShareModal,
    RenameModal,
    MoveModal,
  ],
  templateUrl: './carpetas.html',
  styleUrl: './carpetas.css',
})
export class Carpetas implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly trashService = inject(TrashService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly contenido = signal<ContenidoCarpeta | null>(null);
  readonly folderId = signal<string | null>(null);

  readonly infoItem = signal<InfoItem | null>(null);
  readonly shareTarget = signal<{
    tipo: 'archivo' | 'carpeta';
    id: string;
    name: string;
  } | null>(null);
  readonly renameTarget = signal<{
    tipo: TipoRecursoEditable;
    id: string;
    name: string;
    fileType?: TipoArchivo;
  } | null>(null);
  readonly moveTarget = signal<{
    tipo: TipoRecursoEditable;
    id: string;
    name: string;
    excludedFolderId?: string;
  } | null>(null);
  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  readonly createFolderOpen = signal(false);
  readonly createFileOpen = signal(false);
  readonly uploadOpen = signal(false);
  readonly saving = signal(false);
  readonly modalError = signal('');

  readonly uploadName = signal('');
  readonly uploadType = signal<TipoArchivo>('txt');
  readonly uploadContent = signal('');
  readonly uploadSize = signal(0);
  readonly uploadError = signal('');

  readonly folderForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
  });

  readonly fileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    type: this.fb.nonNullable.control<TipoArchivo>('txt'),
    content: [''],
  });

  readonly folders = computed(() => this.contenido()?.subcarpetas ?? []);
  readonly files = computed(() => this.contenido()?.archivos ?? []);
  readonly ruta = computed(() => this.contenido()?.ruta ?? []);
  readonly currentName = computed(() => this.contenido()?.carpeta?.name ?? 'Inicio');
  readonly isCurrentOwner = computed(
    () => this.folderId() !== null && this.contenido()?.permiso === 'owner',
  );
  readonly canEdit = computed(() => {
    if (this.folderId() === null) return true;
    const permiso = this.contenido()?.permiso;
    return permiso === 'owner' || permiso === 'edit';
  });

  readonly canComment = computed(() => {
    if (this.folderId() === null) return false;
    const permiso = this.contenido()?.permiso;
    return (
      permiso === 'owner' ||
      permiso === 'edit' ||
      permiso === 'comment'
    );
  });

  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.folderId.set(id);
      this.load(id);
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  load(id: string | null = this.folderId()): void {
    this.loading.set(true);
    this.error.set('');

    if (id) {
      this.carpetaService.contenido(id).subscribe({
        next: (contenido) => {
          this.contenido.set(contenido);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractHttpError(err, 'No se pudo abrir la carpeta'));
          this.loading.set(false);
        },
      });
      return;
    }

    forkJoin([
      this.carpetaService.list({ parentFolder: 'null', limit: 200 }),
      this.archivoService.list({ parentFolder: 'null', limit: 200 }),
    ]).subscribe({
      next: ([carpetas, archivos]) => {
        const total = archivos.items.reduce((sum, item) => sum + item.size, 0);
        this.contenido.set({
          carpeta: {
            _id: '',
            name: 'Inicio',
            parentFolder: null,
            ancestors: [],
            size: total,
            owner: this.auth.user()?.id ?? '',
            inTrash: false,
            isVisible: true,
          },
          subcarpetas: carpetas.items,
          archivos: archivos.items,
          ruta: [],
          permiso: 'owner',
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractHttpError(err, 'No se pudieron cargar los documentos'));
        this.loading.set(false);
      },
    });
  }

  openFolder(id: string): void {
    void this.router.navigate(['/carpetas', id]);
  }

  openFile(id: string): void {
    void this.router.navigate(['/archivos', id]);
  }

  ownerName(recurso: Carpeta | Archivo): string {
    return usuarioNombre(recurso.owner);
  }

  isOwner(recurso: Carpeta | Archivo): boolean {
    return usuarioId(recurso.owner) === this.auth.user()?.id;
  }

  ext(file: Archivo): string {
    return file.type || extensionDe(file.name);
  }

  size(bytes: number | undefined): string {
    return formatBytes(bytes);
  }

  date(value?: string): string {
    return formatDate(value);
  }

  openShare(
    tipo: 'archivo' | 'carpeta',
    recurso: Carpeta | Archivo,
    event: Event,
  ): void {
    event.stopPropagation();
    if (!this.isOwner(recurso)) return;
    this.shareTarget.set({ tipo, id: recurso._id, name: recurso.name });
  }

  shareCurrentFolder(): void {
    const carpeta = this.contenido()?.carpeta;
    if (!carpeta || !this.isCurrentOwner()) return;
    this.shareTarget.set({
      tipo: 'carpeta',
      id: carpeta._id,
      name: carpeta.name,
    });
  }

  openRename(
    tipo: TipoRecursoEditable,
    recurso: Carpeta | Archivo,
    event?: Event,
  ): void {
    event?.stopPropagation();
    if (!this.isOwner(recurso)) return;
    this.renameTarget.set({
      tipo,
      id: recurso._id,
      name: recurso.name,
      fileType: tipo === 'archivo' ? (recurso as Archivo).type : undefined,
    });
  }

  openMove(
    tipo: TipoRecursoEditable,
    recurso: Carpeta | Archivo,
    event?: Event,
  ): void {
    event?.stopPropagation();
    if (!this.isOwner(recurso)) return;
    this.moveTarget.set({
      tipo,
      id: recurso._id,
      name: recurso.name,
      excludedFolderId: tipo === 'carpeta' ? recurso._id : undefined,
    });
  }

  renameCurrentFolder(): void {
    const carpeta = this.contenido()?.carpeta;
    if (!carpeta || !this.isCurrentOwner()) return;
    this.renameTarget.set({
      tipo: 'carpeta',
      id: carpeta._id,
      name: carpeta.name,
    });
  }

  moveCurrentFolder(): void {
    const carpeta = this.contenido()?.carpeta;
    if (!carpeta || !this.isCurrentOwner()) return;
    this.moveTarget.set({
      tipo: 'carpeta',
      id: carpeta._id,
      name: carpeta.name,
      excludedFolderId: carpeta._id,
    });
  }

  onRenamed(): void {
    this.renameTarget.set(null);
    this.showToast('Recurso renombrado correctamente', 'success');
    this.load();
  }

  onMoved(): void {
    this.moveTarget.set(null);
    this.showToast('Recurso movido correctamente', 'success');
    this.load();
  }

  showFolderInfo(folder: Carpeta, event: Event): void {
    event.stopPropagation();
    this.infoItem.set({
      name: folder.name,
      kind: 'carpeta',
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      size: folder.size,
      owner: this.ownerName(folder),
    });
  }

  showFileInfo(file: Archivo, event: Event): void {
    event.stopPropagation();
    this.infoItem.set({
      name: file.name,
      kind: 'archivo',
      type: this.ext(file),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      size: file.size,
      owner: this.ownerName(file),
    });
  }

  openCreateFolder(): void {
    this.folderForm.reset({ name: '' });
    this.modalError.set('');
    this.createFolderOpen.set(true);
  }

  closeCreateFolder(): void {
    if (this.saving()) return;
    this.createFolderOpen.set(false);
  }

  submitFolder(): void {
    if (this.folderForm.invalid) {
      this.folderForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.modalError.set('');

    this.carpetaService
      .create({
        name: this.folderForm.getRawValue().name.trim(),
        parentFolder: this.folderId() ?? undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.createFolderOpen.set(false);
          this.showToast('Carpeta creada correctamente', 'success');
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.modalError.set(extractHttpError(err, 'No se pudo crear la carpeta'));
        },
      });
  }

  openCreateFile(): void {
    this.fileForm.reset({ name: '', type: 'txt', content: '' });
    this.modalError.set('');
    this.createFileOpen.set(true);
  }

  closeCreateFile(): void {
    if (this.saving()) return;
    this.createFileOpen.set(false);
  }

  submitFile(): void {
    if (this.fileForm.invalid) {
      this.fileForm.markAllAsTouched();
      return;
    }

    const value = this.fileForm.getRawValue();
    const nombre = this.normalizarNombre(value.name, value.type);

    if (!nombre) {
      const extension = extensionDe(value.name.trim());
      this.modalError.set(
        extension === 'txt' || extension === 'md'
          ? 'La extensión del nombre no coincide con el tipo seleccionado'
          : 'El nombre debe tener extensión .txt o .md',
      );
      return;
    }

    this.saving.set(true);
    this.modalError.set('');

    this.archivoService
      .create({
        name: nombre,
        type: value.type,
        content: value.content,
        parentFolder: this.folderId() ?? undefined,
      })
      .subscribe({
        next: (archivo) => {
          this.saving.set(false);
          this.createFileOpen.set(false);
          this.showToast('Archivo creado correctamente', 'success');
          void this.router.navigate(['/archivos', archivo._id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.modalError.set(extractHttpError(err, 'No se pudo crear el archivo'));
        },
      });
  }

  openUpload(): void {
    this.uploadName.set('');
    this.uploadContent.set('');
    this.uploadSize.set(0);
    this.uploadError.set('');
    this.modalError.set('');
    this.uploadOpen.set(true);
  }

  closeUpload(): void {
    if (this.saving()) return;
    this.uploadOpen.set(false);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    this.uploadError.set('');
    this.uploadContent.set('');
    this.uploadName.set('');

    const extension = extensionDe(file.name);
    if (extension !== 'txt' && extension !== 'md') {
      this.uploadError.set('Solo se permiten archivos .txt o .md');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      this.uploadError.set('El archivo supera el límite de 16 MB');
      return;
    }

    try {
      const content = await file.text();
      this.uploadName.set(file.name);
      this.uploadType.set(extension);
      this.uploadContent.set(content);
      this.uploadSize.set(file.size);
    } catch {
      this.uploadError.set('No se pudo leer el archivo seleccionado');
    }
  }

  submitUpload(): void {
    if (!this.uploadName()) {
      this.uploadError.set('Selecciona un archivo válido antes de continuar');
      return;
    }

    this.saving.set(true);
    this.modalError.set('');

    this.archivoService
      .create({
        name: this.uploadName(),
        type: this.uploadType(),
        content: this.uploadContent(),
        parentFolder: this.folderId() ?? undefined,
      })
      .subscribe({
        next: (archivo) => {
          this.saving.set(false);
          this.uploadOpen.set(false);
          this.showToast('Archivo cargado correctamente', 'success');
          void this.router.navigate(['/archivos', archivo._id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.modalError.set(extractHttpError(err, 'No se pudo cargar el archivo'));
        },
      });
  }

  descargar(file: Archivo, event: Event): void {
    event.stopPropagation();
    this.archivoService.descargar(file._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('Descarga iniciada', 'success');
      },
      error: (err) =>
        this.showToast(extractHttpError(err, 'No se pudo descargar'), 'error'),
    });
  }

  enviarArchivoPapelera(file: Archivo, event: Event): void {
    event.stopPropagation();
    if (!confirm(`¿Enviar "${file.name}" a la papelera?`)) return;

    this.archivoService.remove(file._id).subscribe({
      next: () => {
        this.trashService.refresh();
        this.showToast('Archivo enviado a la papelera', 'success');
        this.load();
      },
      error: (err) =>
        this.showToast(
          extractHttpError(err, 'No se pudo enviar a la papelera'),
          'error',
        ),
    });
  }

  enviarCarpetaPapelera(folder: Carpeta, event: Event): void {
    event.stopPropagation();
    if (!confirm(`¿Enviar "${folder.name}" a la papelera? Sus elementos también se ocultarán.`))
      return;

    this.carpetaService.remove(folder._id).subscribe({
      next: () => {
        this.trashService.refresh();
        this.showToast('Carpeta enviada a la papelera', 'success');
        this.load();
      },
      error: (err) =>
        this.showToast(
          extractHttpError(err, 'No se pudo enviar a la papelera'),
          'error',
        ),
    });
  }

  private normalizarNombre(nombre: string, tipo: TipoArchivo): string | null {
    const limpio = nombre.trim();
    const extension = extensionDe(limpio);

    if (!extension) return `${limpio}.${tipo}`;
    if (extension !== 'txt' && extension !== 'md') return null;
    if (extension !== tipo) return null;

    return limpio;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }
}
