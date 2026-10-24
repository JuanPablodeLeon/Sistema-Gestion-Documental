import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { forkJoin, map, Observable, of, catchError } from 'rxjs';
import { ArchivoService } from '../core/services/archivo.service';
import { CarpetaService } from '../core/services/carpeta.service';
import { TrashService } from '../core/services/trash.service';
import { extractHttpError } from '../core/utils/http-error';

interface TrashItem {
  key: string;
  kind: 'carpeta' | 'archivo';
  id: string;
  name: string;
  type?: string;
}

interface ResultadoOperacion {
  ok: boolean;
  nombre: string;
  error?: string;
}

@Component({
  selector: 'app-papelera',
  standalone: true,
  templateUrl: './papelera.html',
  styleUrl: './papelera.css',
})
export class Papelera implements OnInit, OnDestroy {
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly trashService = inject(TrashService);

  readonly items = signal<TrashItem[]>([]);
  readonly selected = signal<Set<string>>(new Set());
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  readonly selectedItems = computed(() =>
    this.items().filter((item) => this.selected().has(item.key)),
  );
  readonly allSelected = computed(
    () => this.items().length > 0 && this.selected().size === this.items().length,
  );

  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.selected.set(new Set());

    forkJoin([
      this.carpetaService.papelera(),
      this.archivoService.papelera(),
    ]).subscribe({
      next: ([carpetas, archivos]) => {
        const elementos: TrashItem[] = [
          ...carpetas.map((carpeta) => ({
            key: `carpeta:${carpeta._id}`,
            kind: 'carpeta' as const,
            id: carpeta._id,
            name: carpeta.name,
          })),
          ...archivos.map((archivo) => ({
            key: `archivo:${archivo._id}`,
            kind: 'archivo' as const,
            id: archivo._id,
            name: archivo.name,
            type: archivo.type,
          })),
        ];

        this.items.set(elementos);
        this.loading.set(false);
        this.trashService.refresh();
      },
      error: (err) => {
        this.error.set(extractHttpError(err, 'No se pudo cargar la papelera'));
        this.loading.set(false);
      },
    });
  }

  toggle(item: TrashItem): void {
    this.selected.update((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(item.key)) nuevo.delete(item.key);
      else nuevo.add(item.key);
      return nuevo;
    });
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selected.set(new Set());
      return;
    }
    this.selected.set(new Set(this.items().map((item) => item.key)));
  }

  restaurarSeleccionados(): void {
    const seleccionados = [...this.selectedItems()].sort((a, b) => {
      if (a.kind === b.kind) return 0;
      return a.kind === 'carpeta' ? -1 : 1;
    });
    if (!seleccionados.length) return;

    this.busy.set(true);
    const operaciones = seleccionados.map((item) => this.restaurar(item));

    forkJoin(operaciones).subscribe((resultados) => {
      this.busy.set(false);
      this.finalizarOperacion(resultados, 'restaurado');
    });
  }

  eliminarSeleccionados(): void {
    const seleccionados = this.selectedItems();
    if (!seleccionados.length) return;

    if (
      !confirm(
        `¿Eliminar definitivamente ${seleccionados.length} elemento(s)? Esta acción no se puede deshacer.`,
      )
    )
      return;

    this.busy.set(true);
    const operaciones = seleccionados.map((item) => this.eliminar(item));

    forkJoin(operaciones).subscribe((resultados) => {
      this.busy.set(false);
      this.finalizarOperacion(resultados, 'eliminado');
    });
  }

  private restaurar(item: TrashItem): Observable<ResultadoOperacion> {
    const peticion =
      item.kind === 'carpeta'
        ? this.carpetaService.restaurar(item.id)
        : this.archivoService.restaurar(item.id);

    return peticion.pipe(
      map(() => ({ ok: true, nombre: item.name })),
      catchError((err) =>
        of({
          ok: false,
          nombre: item.name,
          error: extractHttpError(err, 'Error al restaurar'),
        }),
      ),
    );
  }

  private eliminar(item: TrashItem): Observable<ResultadoOperacion> {
    const peticion =
      item.kind === 'carpeta'
        ? this.carpetaService.eliminarDefinitivo(item.id)
        : this.archivoService.eliminarDefinitivo(item.id);

    return peticion.pipe(
      map(() => ({ ok: true, nombre: item.name })),
      catchError((err) =>
        of({
          ok: false,
          nombre: item.name,
          error: extractHttpError(err, 'Error al eliminar'),
        }),
      ),
    );
  }

  private finalizarOperacion(
    resultados: ResultadoOperacion[],
    accion: 'restaurado' | 'eliminado',
  ): void {
    const exitos = resultados.filter((r) => r.ok).length;
    const fallos = resultados.filter((r) => !r.ok);

    this.load();

    if (!fallos.length) {
      this.showToast(
        `${exitos} elemento(s) ${accion}(s) correctamente`,
        'success',
      );
      return;
    }

    if (exitos > 0) {
      this.showToast(
        `${exitos} ${accion}(s). ${fallos.length} fallaron: ${fallos[0].error ?? ''}`,
        'error',
      );
    } else {
      this.showToast(fallos[0].error ?? 'No se pudo completar la operación', 'error');
    }
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 4200);
  }
}
