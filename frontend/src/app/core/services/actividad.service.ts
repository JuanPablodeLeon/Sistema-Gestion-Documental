import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { ListaActividades } from '../models/actividad.model';

export interface FiltroActividad {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly http = inject(HttpClient);

  todas(filtro: FiltroActividad = {}): Observable<ListaActividades> {
    return this.http.get<ListaActividades>(`${API_URL}/actividad`, {
      params: this.buildParams(filtro),
    });
  }

  notificaciones(filtro: FiltroActividad = {}): Observable<ListaActividades> {
    return this.http.get<ListaActividades>(
      `${API_URL}/actividad/notificaciones`,
      { params: this.buildParams(filtro) },
    );
  }

  private buildParams(filtro: object): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filtro)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
