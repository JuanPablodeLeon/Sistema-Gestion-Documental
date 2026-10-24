import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ComentarioReportado } from '../core/models/comentario.model';
import { usuarioNombre } from '../core/models/comun.model';
import { ReporteService } from '../core/services/reporte.service';
import { extractHttpError } from '../core/utils/http-error';
import { formatDateTime } from '../core/utils/format';

type FiltroTipo = 'all' | 'archivo' | 'carpeta';

@Component({
  selector: 'app-reportes-comentarios',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reportes-comentarios.html',
  styleUrl: './reportes-comentarios.css',
})
export class ReportesComentarios implements OnInit {
  private readonly reporteService = inject(ReporteService);

  readonly items = signal<ComentarioReportado[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');
  readonly tipoFiltro = signal<FiltroTipo>('all');

  readonly total = computed(() => this.items().length);
  readonly archivos = computed(
    () => this.items().filter((item) => item.tipoRecurso === 'archivo').length,
  );
  readonly carpetas = computed(
    () => this.items().filter((item) => item.tipoRecurso === 'carpeta').length,
  );

  readonly filtrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const tipo = this.tipoFiltro();

    return this.items().filter((item) => {
      const coincideTipo = tipo === 'all' || item.tipoRecurso === tipo;
      if (!coincideTipo) return false;
      if (!termino) return true;

      const texto = [
        item.texto,
        item.recursoNombre,
        usuarioNombre(item.autor),
        usuarioNombre(item.reportadoPor),
        usuarioNombre(item.propietario),
      ]
        .join(' ')
        .toLowerCase();

      return texto.includes(termino);
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.reporteService.comentariosReportados().subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          extractHttpError(err, 'No se pudieron cargar los reportes'),
        );
        this.loading.set(false);
      },
    });
  }

  limpiar(): void {
    this.busqueda.set('');
    this.tipoFiltro.set('all');
  }

  autor(item: ComentarioReportado): string {
    return usuarioNombre(item.autor);
  }

  reportadoPor(item: ComentarioReportado): string {
    return usuarioNombre(item.reportadoPor);
  }

  propietario(item: ComentarioReportado): string {
    return usuarioNombre(item.propietario);
  }

  fecha(value: string | null): string {
    return formatDateTime(value);
  }

  icono(item: ComentarioReportado): string {
    return item.tipoRecurso === 'archivo' ? '📄' : '📁';
  }

  rutaRecurso(item: ComentarioReportado): string[] {
    return item.tipoRecurso === 'archivo'
      ? ['/archivos', item.recursoId]
      : ['/carpetas', item.recursoId];
  }
}
