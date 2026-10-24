import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Carpeta, ContenidoCarpeta, ListaCarpetas } from '../models/carpeta.model';
import { PermisoEntry } from '../models/comun.model';
import { NivelAcceso, PermisoBase } from '../utils/permisos';

export interface ListarCarpetasParams {
  parentFolder?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'nombre';
}

export interface CrearCarpetaDto {
  name: string;
  parentFolder?: string;
}

export interface ActualizarCarpetaDto {
  name?: string;
  parentFolder?: string;
}

export interface AccionCarpetaResponse {
  message: string;
  id: string;
}

@Injectable({ providedIn: 'root' })
export class CarpetaService {
  private readonly http = inject(HttpClient);

  list(params: ListarCarpetasParams = {}): Observable<ListaCarpetas> {
    return this.http.get<ListaCarpetas>(`${API_URL}/carpeta`, {
      params: this.buildParams(params),
    });
  }

  contenido(id: string): Observable<ContenidoCarpeta> {
    return this.http.get<ContenidoCarpeta>(`${API_URL}/carpeta/${id}/contenido`);
  }

  findOne(id: string): Observable<ContenidoCarpeta> {
    return this.http.get<ContenidoCarpeta>(`${API_URL}/carpeta/${id}`);
  }

  create(dto: CrearCarpetaDto): Observable<Carpeta> {
    return this.http.post<Carpeta>(`${API_URL}/carpeta`, dto);
  }

  update(id: string, dto: ActualizarCarpetaDto): Observable<Carpeta> {
    return this.http.patch<Carpeta>(`${API_URL}/carpeta/${id}`, dto);
  }

  mover(id: string, parentFolder?: string): Observable<Carpeta> {
    return this.http.patch<Carpeta>(`${API_URL}/carpeta/${id}/mover`, {
      ...(parentFolder ? { parentFolder } : {}),
    });
  }

  papelera(): Observable<Carpeta[]> {
    return this.http.get<Carpeta[]>(`${API_URL}/carpeta/papelera`);
  }

  recibidas(): Observable<Carpeta[]> {
    return this.http.get<Carpeta[]>(`${API_URL}/carpeta/recibidas`);
  }

  remove(id: string): Observable<AccionCarpetaResponse> {
    return this.http.delete<AccionCarpetaResponse>(`${API_URL}/carpeta/${id}`);
  }

  restaurar(id: string): Observable<AccionCarpetaResponse> {
    return this.http.patch<AccionCarpetaResponse>(
      `${API_URL}/carpeta/${id}/restaurar`,
      {},
    );
  }

  eliminarDefinitivo(id: string): Observable<AccionCarpetaResponse> {
    return this.http.delete<AccionCarpetaResponse>(
      `${API_URL}/carpeta/${id}/permanente`,
    );
  }

  comparticiones(
    id: string,
  ): Observable<{ _id: string; name: string; shareWith: PermisoEntry[] }> {
    return this.http.get<{
      _id: string;
      name: string;
      shareWith: PermisoEntry[];
    }>(`${API_URL}/carpeta/${id}/compartir`);
  }

  compartirVarios(
    id: string,
    usuarios: Array<{ userId: string; nivel: NivelAcceso }>,
  ): Observable<{ _id: string; name: string; shareWith: PermisoEntry[] }> {
    return this.http.post<{
      _id: string;
      name: string;
      shareWith: PermisoEntry[];
    }>(`${API_URL}/carpeta/${id}/compartir/lote`, { usuarios });
  }

  actualizarPermiso(
    id: string,
    userId: string,
    permissions: PermisoBase[],
  ): Observable<{ _id: string; name: string; shareWith: PermisoEntry[] }> {
    return this.http.patch<{
      _id: string;
      name: string;
      shareWith: PermisoEntry[];
    }>(`${API_URL}/carpeta/${id}/compartir/${userId}`, {
      userId,
      permissions,
    });
  }

  revocarPermiso(
    id: string,
    userId: string,
  ): Observable<{ _id: string; name: string; shareWith: PermisoEntry[] }> {
    return this.http.delete<{
      _id: string;
      name: string;
      shareWith: PermisoEntry[];
    }>(`${API_URL}/carpeta/${id}/compartir/${userId}`);
  }

  private buildParams(params: object): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
