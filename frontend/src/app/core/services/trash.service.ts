import { inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ArchivoService } from './archivo.service';
import { CarpetaService } from './carpeta.service';

@Injectable({ providedIn: 'root' })
export class TrashService {
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);

  readonly count = signal(0);
  readonly loaded = signal(false);

  refresh(): void {
    forkJoin([
      this.carpetaService.papelera(),
      this.archivoService.papelera(),
    ]).subscribe({
      next: ([carpetas, archivos]) => {
        this.count.set(carpetas.length + archivos.length);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }
}
