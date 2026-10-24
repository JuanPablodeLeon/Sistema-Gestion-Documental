import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TipoArchivo } from '../../core/models/archivo.model';
import { ArchivoService } from '../../core/services/archivo.service';
import { CarpetaService } from '../../core/services/carpeta.service';
import { extractHttpError } from '../../core/utils/http-error';
import { extensionDe } from '../../core/utils/format';

export type TipoRecursoEditable = 'archivo' | 'carpeta';

@Component({
  selector: 'app-rename-modal',
  standalone: true,
  templateUrl: './rename-modal.html',
})
export class RenameModal {
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);

  readonly tipo = input.required<TipoRecursoEditable>();
  readonly recursoId = input.required<string>();
  readonly currentName = input.required<string>();
  readonly tipoArchivo = input<TipoArchivo>('txt');
  readonly closed = output<void>();
  readonly renamed = output<void>();

  readonly nombre = signal('');
  readonly saving = signal(false);
  readonly error = signal('');

  constructor() {
    effect(() => {
      this.nombre.set(this.currentName());
      this.error.set('');
    });
  }

  submit(): void {
    if (this.saving()) return;

    const nombre = this.normalizar();
    if (!nombre) return;

    this.saving.set(true);
    this.error.set('');

    const peticion =
      this.tipo() === 'archivo'
        ? this.archivoService.update(this.recursoId(), { name: nombre })
        : this.carpetaService.update(this.recursoId(), { name: nombre });

    peticion.subscribe({
      next: () => {
        this.saving.set(false);
        this.renamed.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(
          extractHttpError(err, 'No se pudo renombrar el recurso'),
        );
      },
    });
  }

  cerrar(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  private normalizar(): string | null {
    const limpio = this.nombre().trim();

    if (!limpio) {
      this.error.set('El nombre es obligatorio');
      return null;
    }

    if (this.tipo() === 'carpeta') {
      if (limpio.length > 150) {
        this.error.set('El nombre no puede superar los 150 caracteres');
        return null;
      }
      return limpio;
    }

    if (limpio.length > 200) {
      this.error.set('El nombre no puede superar los 200 caracteres');
      return null;
    }

    const extension = extensionDe(limpio);
    if (!extension) return `${limpio}.${this.tipoArchivo()}`;
    if (extension !== 'txt' && extension !== 'md') {
      this.error.set('El archivo debe tener extensión .txt o .md');
      return null;
    }
    if (extension !== this.tipoArchivo()) {
      this.error.set(
        `La extensión debe coincidir con el tipo actual (.${this.tipoArchivo()})`,
      );
      return null;
    }

    return limpio;
  }
}
