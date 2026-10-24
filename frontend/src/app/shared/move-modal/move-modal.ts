import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { Carpeta } from '../../core/models/carpeta.model';
import { usuarioId } from '../../core/models/comun.model';
import { ArchivoService } from '../../core/services/archivo.service';
import { AuthService } from '../../core/services/auth.service';
import { CarpetaService } from '../../core/services/carpeta.service';
import { extractHttpError } from '../../core/utils/http-error';
import { TipoRecursoEditable } from '../rename-modal/rename-modal';

interface Destino {
  id: string;
  label: string;
}

@Component({
  selector: 'app-move-modal',
  standalone: true,
  templateUrl: './move-modal.html',
})
export class MoveModal implements OnInit {
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly auth = inject(AuthService);

  readonly tipo = input.required<TipoRecursoEditable>();
  readonly recursoId = input.required<string>();
  readonly recursoNombre = input.required<string>();
  readonly excludedFolderId = input('');

  readonly closed = output<void>();
  readonly moved = output<void>();

  readonly carpetas = signal<Carpeta[]>([]);
  readonly destino = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly destinos = computed(() => this.construirDestinos(this.carpetas()));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');

    this.carpetaService.list({ limit: 200 }).subscribe({
      next: (res) => {
        this.carpetas.set(res.items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          extractHttpError(err, 'No se pudieron cargar las carpetas'),
        );
        this.loading.set(false);
      },
    });
  }

  mover(): void {
    if (this.saving()) return;

    this.saving.set(true);
    this.error.set('');
    const destino = this.destino() || undefined;

    const peticion =
      this.tipo() === 'archivo'
        ? this.archivoService.mover(this.recursoId(), destino)
        : this.carpetaService.mover(this.recursoId(), destino);

    peticion.subscribe({
      next: () => {
        this.saving.set(false);
        this.moved.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractHttpError(err, 'No se pudo mover el recurso'));
      },
    });
  }

  cerrar(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  private construirDestinos(carpetas: Carpeta[]): Destino[] {
    const userId = this.auth.user()?.id;
    const propioId = (carpeta: Carpeta) =>
      usuarioId(carpeta.owner) === userId;

    const propias = carpetas.filter(propioId);
    const ids = new Set(propias.map((carpeta) => carpeta._id));
    const excluida = this.excludedFolderId();
    const excluidas = new Set<string>();

    if (excluida) {
      for (const carpeta of propias) {
        const esLaActual = carpeta._id === excluida;
        const esDescendiente = carpeta.ancestors.some(
          (ancestro) => String(ancestro) === excluida,
        );
        if (esLaActual || esDescendiente) {
          excluidas.add(carpeta._id);
        }
      }
    }

    const disponibles = propias.filter(
      (carpeta) => !excluidas.has(carpeta._id),
    );
    const hijos = new Map<string, Carpeta[]>();

    for (const carpeta of disponibles) {
      const padre =
        carpeta.parentFolder && ids.has(carpeta.parentFolder)
          ? carpeta.parentFolder
          : '';
      const lista = hijos.get(padre) ?? [];
      lista.push(carpeta);
      hijos.set(padre, lista);
    }

    for (const lista of hijos.values()) {
      lista.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }

    const destinos: Destino[] = [];
    const recorrer = (padre: string, nivel: number) => {
      for (const carpeta of hijos.get(padre) ?? []) {
        destinos.push({
          id: carpeta._id,
          label: `${'— '.repeat(nivel)}${carpeta.name}`,
        });
        recorrer(carpeta._id, nivel + 1);
      }
    };
    recorrer('', 0);

    return destinos;
  }
}
