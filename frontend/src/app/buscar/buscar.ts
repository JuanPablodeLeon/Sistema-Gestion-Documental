import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Archivo, TipoArchivo } from '../core/models/archivo.model';
import { usuarioNombre } from '../core/models/comun.model';
import {
  ArchivoService,
  ListarArchivosParams,
} from '../core/services/archivo.service';
import { extractHttpError } from '../core/utils/http-error';
import { formatBytes, formatDate } from '../core/utils/format';

type OrdenBusqueda = 'reciente' | 'nombre' | 'tamanio';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './buscar.html',
})
export class Buscar implements OnInit {
  private readonly archivoService = inject(ArchivoService);

  readonly q = signal('');
  readonly tipo = signal<'' | TipoArchivo>('');
  readonly orden = signal<OrdenBusqueda>('reciente');
  readonly desde = signal('');
  readonly hasta = signal('');

  readonly resultados = signal<Archivo[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 12;
  readonly loading = signal(false);
  readonly error = signal('');

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit)),
  );

  readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.page();
    const visibles = 7;

    if (total <= visibles) {
      return Array.from({ length: total }, (_, indice) => indice + 1);
    }

    const inicio = Math.min(
      Math.max(actual - Math.floor(visibles / 2), 1),
      total - visibles + 1,
    );

    return Array.from({ length: visibles }, (_, indice) => inicio + indice);
  });

  readonly hayFiltros = computed(
    () =>
      this.q().trim().length > 0 ||
      this.tipo() !== '' ||
      this.orden() !== 'reciente' ||
      this.desde() !== '' ||
      this.hasta() !== '',
  );

  ngOnInit(): void {
    this.buscar(1);
  }

  submit(event?: Event): void {
    event?.preventDefault();
    this.buscar(1);
  }

  buscar(page = 1): void {
    if (this.desde() && this.hasta() && this.desde() > this.hasta()) {
      this.error.set('La fecha "desde" no puede ser posterior a la fecha "hasta"');
      return;
    }

    const params: ListarArchivosParams = {
      q: this.q().trim() || undefined,
      type: this.tipo() || undefined,
      desde: this.desde() ? `${this.desde()}T00:00:00.000` : undefined,
      hasta: this.hasta() ? `${this.hasta()}T23:59:59.999` : undefined,
      page,
      limit: this.limit,
      sort:
        this.orden() === 'nombre'
          ? 'nombre'
          : this.orden() === 'tamanio'
            ? 'tamanio'
            : undefined,
    };

    this.loading.set(true);
    this.error.set('');

    this.archivoService.list(params).subscribe({
      next: (res) => {
        this.resultados.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.page.set(res.page ?? page);
        this.loading.set(false);
      },
      error: (err) => {
        this.resultados.set([]);
        this.total.set(0);
        this.error.set(extractHttpError(err, 'No se pudo realizar la búsqueda'));
        this.loading.set(false);
      },
    });
  }

  limpiar(): void {
    this.q.set('');
    this.tipo.set('');
    this.orden.set('reciente');
    this.desde.set('');
    this.hasta.set('');
    this.buscar(1);
  }

  irAPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas() || page === this.page()) return;
    this.buscar(page);
  }

  ownerName(archivo: Archivo): string {
    return usuarioNombre(archivo.owner);
  }

  size(bytes: number | undefined): string {
    return formatBytes(bytes ?? 0);
  }

  date(value?: string): string {
    return formatDate(value);
  }
}
