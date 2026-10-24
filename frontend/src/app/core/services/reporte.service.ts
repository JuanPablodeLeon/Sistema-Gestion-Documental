import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { ComentarioReportado } from '../models/comentario.model';
import {
  ActividadPorPeriodo,
  ActividadPorTipo,
  ArchivoMasCompartido,
  ArchivoMasOperaciones,
  ArchivosPorRango,
  ArchivosPorTipo,
  HistorialActividad,
  RecursoCompartido,
  RecursoRecibido,
  ReporteUsuario,
  TopUsuarioArchivos,
  UsuarioMasCompartidos,
} from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);

  comentariosReportados(): Observable<ComentarioReportado[]> {
    return this.http.get<ComentarioReportado[]>(
      `${API_URL}/reportes/comentarios-reportados`,
    );
  }

  usuarios(): Observable<ReporteUsuario[]> {
    return this.http.get<ReporteUsuario[]>(`${API_URL}/reportes/usuarios`);
  }

  archivosPorTipo(): Observable<ArchivosPorTipo[]> {
    return this.http.get<ArchivosPorTipo[]>(
      `${API_URL}/reportes/archivos/por-tipo`,
    );
  }

  archivosPorRango(desde: string, hasta: string): Observable<ArchivosPorRango> {
    return this.http.get<ArchivosPorRango>(
      `${API_URL}/reportes/archivos/rango-fechas`,
      { params: this.params({ desde, hasta }) },
    );
  }

  archivosMasOperaciones(limit = 10): Observable<ArchivoMasOperaciones[]> {
    return this.http.get<ArchivoMasOperaciones[]>(
      `${API_URL}/reportes/archivos/mas-operaciones`,
      { params: this.params({ limit }) },
    );
  }

  topUsuariosArchivos(limit = 10): Observable<TopUsuarioArchivos[]> {
    return this.http.get<TopUsuarioArchivos[]>(
      `${API_URL}/reportes/usuarios/top-archivos`,
      { params: this.params({ limit }) },
    );
  }

  usuariosMasCompartidos(limit = 10): Observable<UsuarioMasCompartidos[]> {
    return this.http.get<UsuarioMasCompartidos[]>(
      `${API_URL}/reportes/usuarios/mas-compartidos`,
      { params: this.params({ limit }) },
    );
  }

  archivosMasCompartidos(limit = 10): Observable<ArchivoMasCompartido[]> {
    return this.http.get<ArchivoMasCompartido[]>(
      `${API_URL}/reportes/comparticion/archivos-mas-usuarios`,
      { params: this.params({ limit }) },
    );
  }

  recursosCompartidosPorUsuario(
    id: string,
  ): Observable<RecursoCompartido[]> {
    return this.http.get<RecursoCompartido[]>(
      `${API_URL}/reportes/comparticion/por-usuario/${id}`,
    );
  }

  recursosRecibidosPorUsuario(id: string): Observable<RecursoRecibido[]> {
    return this.http.get<RecursoRecibido[]>(
      `${API_URL}/reportes/comparticion/recibidos/${id}`,
    );
  }

  actividadUsuario(
    id: string,
    desde: string,
    hasta: string,
  ): Observable<HistorialActividad> {
    return this.http.get<HistorialActividad>(
      `${API_URL}/reportes/actividad/usuario/${id}`,
      { params: this.params({ desde, hasta }) },
    );
  }

  actividadPorTipo(): Observable<ActividadPorTipo[]> {
    return this.http.get<ActividadPorTipo[]>(
      `${API_URL}/reportes/actividad/por-tipo`,
    );
  }

  actividadPorPeriodo(
    unidad: string,
    desde: string,
    hasta: string,
  ): Observable<ActividadPorPeriodo[]> {
    return this.http.get<ActividadPorPeriodo[]>(
      `${API_URL}/reportes/actividad/por-periodo`,
      { params: this.params({ unidad, desde, hasta }) },
    );
  }

  principalesAcciones(limit = 10): Observable<ActividadPorTipo[]> {
    return this.http.get<ActividadPorTipo[]>(
      `${API_URL}/reportes/actividad/principales-acciones`,
      { params: this.params({ limit }) },
    );
  }

  private params(
    values: Record<string, string | number | null | undefined>,
  ): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
