import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import {
  Archivo,
  ArchivoDetalle,
  ListaArchivos,
  TipoArchivo,
} from '../models/archivo.model';
import { PermisoEntry } from '../models/comun.model';
import { NivelAcceso, PermisoBase } from '../utils/permisos';

export interface ListarArchivosParams {
  parentFolder?: string;
  q?: string;
  type?: TipoArchivo;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
  sort?: 'nombre' | 'tamanio';
}

export interface CrearArchivoDto {
  name: string;
  type?: TipoArchivo;
  parentFolder?: string;
  content: string;
}

export interface ActualizarArchivoDto {
  name?: string;
  content?: string;
}

export interface AccionArchivoResponse {
  message: string;
  id: string;
}

@Injectable({ providedIn: 'root' })
export class ArchivoService {
  private readonly http = inject(HttpClient);

  list(params: ListarArchivosParams = {}): Observable<ListaArchivos> {
    return this.http.get<ListaArchivos>(`${API_URL}/archivo`, {
      params: this.buildParams(params),
    });
  }

  findOne(id: string): Observable<ArchivoDetalle> {
    return this.http.get<ArchivoDetalle>(`${API_URL}/archivo/${id}`);
  }

  create(dto: CrearArchivoDto): Observable<Archivo> {
    return this.http.post<Archivo>(`${API_URL}/archivo`, dto);
  }

  update(id: string, dto: ActualizarArchivoDto): Observable<Archivo> {
    return this.http.patch<Archivo>(`${API_URL}/archivo/${id}`, dto);
  }

  mover(id: string, parentFolder?: string): Observable<Archivo> {
    return this.http.patch<Archivo>(`${API_URL}/archivo/${id}/mover`, {
      ...(parentFolder ? { parentFolder } : {}),
    });
  }

  papelera(): Observable<Archivo[]> {
    return this.http.get<Archivo[]>(`${API_URL}/archivo/papelera`);
  }

  recibidos(): Observable<Archivo[]> {
    return this.http.get<Archivo[]>(`${API_URL}/archivo/recibidos`);
  }

  remove(id: string): Observable<AccionArchivoResponse> {
    return this.http.delete<AccionArchivoResponse>(`${API_URL}/archivo/${id}`);
  }

  restaurar(id: string): Observable<AccionArchivoResponse> {
    return this.http.patch<AccionArchivoResponse>(
      `${API_URL}/archivo/${id}/restaurar`,
      {},
    );
  }

  eliminarDefinitivo(id: string): Observable<AccionArchivoResponse> {
    return this.http.delete<AccionArchivoResponse>(
      `${API_URL}/archivo/${id}/permanente`,
    );
  }

  descargar(id: string): Observable<Blob> {
    return this.http.get(`${API_URL}/archivo/${id}/descargar`, {
      responseType: 'blob',
    });
  }

  comparticiones(
    id: string,
  ): Observable<{ _id: string; name: string; shareWith: PermisoEntry[] }> {
    return this.http.get<{
      _id: string;
      name: string;
      shareWith: PermisoEntry[];
    }>(`${API_URL}/archivo/${id}/compartir`);
  }

  compartirVarios(
    id: string,
    usuarios: Array<{ userId: string; nivel: NivelAcceso }>,
  ): Observable<{ _id: string; name: string; shareWith: PermisoEntry[] }> {
    return this.http.post<{
      _id: string;
      name: string;
      shareWith: PermisoEntry[];
    }>(`${API_URL}/archivo/${id}/compartir/lote`, { usuarios });
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
    }>(`${API_URL}/archivo/${id}/compartir/${userId}`, {
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
    }>(`${API_URL}/archivo/${id}/compartir/${userId}`);
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
