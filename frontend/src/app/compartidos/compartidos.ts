import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Archivo } from '../core/models/archivo.model';
import { Carpeta } from '../core/models/carpeta.model';
import { usuarioId, usuarioNombre } from '../core/models/comun.model';
import { ArchivoService } from '../core/services/archivo.service';
import { AuthService } from '../core/services/auth.service';
import { CarpetaService } from '../core/services/carpeta.service';
import { extractHttpError } from '../core/utils/http-error';
import { formatBytes, formatDate } from '../core/utils/format';
import { nivelDeEntrada, nivelLabel } from '../core/utils/permisos';

@Component({
  selector: 'app-compartidos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './compartidos.html',
})
export class Compartidos implements OnInit {
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly auth = inject(AuthService);

  readonly carpetas = signal<Carpeta[]>([]);
  readonly archivos = signal<Archivo[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly total = computed(
    () => this.carpetas().length + this.archivos().length,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      carpetas: this.carpetaService.recibidas(),
      archivos: this.archivoService.recibidos(),
    }).subscribe({
      next: ({ carpetas, archivos }) => {
        this.carpetas.set(carpetas ?? []);
        this.archivos.set(archivos ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          extractHttpError(
            err,
            'No se pudieron cargar los recursos compartidos contigo',
          ),
        );
        this.loading.set(false);
      },
    });
  }

  ownerName(recurso: Carpeta | Archivo): string {
    return usuarioNombre(recurso.owner);
  }

  nivel(recurso: Carpeta | Archivo): string {
    const userId = this.auth.user()?.id;
    const entrada = recurso.shareWith?.find(
      (entry) => usuarioId(entry.user) === userId,
    );
    return entrada ? nivelLabel(nivelDeEntrada(entrada)) : 'Compartido';
  }

  size(bytes: number | undefined): string {
    return formatBytes(bytes ?? 0);
  }

  date(value?: string): string {
    return formatDate(value);
  }
}
