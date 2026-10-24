import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Comentario } from '../models/comentario.model';

export type TipoComentario = 'archivo' | 'carpeta';

export interface ReportarComentarioResponse {
  message: string;
  id: string;
}

@Injectable({ providedIn: 'root' })
export class ComentarioService {
  private readonly http = inject(HttpClient);

  listar(tipo: TipoComentario, recursoId: string): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(
      `${API_URL}/comentarios/${tipo}/${recursoId}`,
    );
  }

  crear(
    tipo: TipoComentario,
    recursoId: string,
    texto: string,
  ): Observable<Comentario> {
    return this.http.post<Comentario>(
      `${API_URL}/comentarios/${tipo}/${recursoId}`,
      { texto },
    );
  }

  reportar(
    tipo: TipoComentario,
    recursoId: string,
    comentarioId: string,
  ): Observable<ReportarComentarioResponse> {
    return this.http.post<ReportarComentarioResponse>(
      `${API_URL}/comentarios/${tipo}/${recursoId}/${comentarioId}/reportar`,
      {},
    );
  }
}
