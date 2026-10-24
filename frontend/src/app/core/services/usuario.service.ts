import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  Usuario,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  list(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API_URL}/usuario`);
  }

  buscar(username: string, excluir?: string): Observable<Usuario[]> {
    let params = new HttpParams().set('username', username);
    if (excluir) params = params.set('excluir', excluir);

    return this.http.get<Usuario[]>(`${API_URL}/usuario/buscar`, { params });
  }

  create(dto: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(`${API_URL}/usuario`, dto);
  }

  update(id: string, dto: UpdateUsuarioDto): Observable<Usuario> {
    return this.http.patch<Usuario>(`${API_URL}/usuario/${id}`, dto);
  }

  remove(id: string): Observable<{ message: string; id: string; status: boolean }> {
    return this.http.delete<{ message: string; id: string; status: boolean }>(
      `${API_URL}/usuario/${id}`,
    );
  }
}
