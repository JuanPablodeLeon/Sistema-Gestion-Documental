import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../api.config';
import { LoginResponse, SessionUser, Usuario } from '../models/usuario.model';

const TOKEN_KEY = 'sgd-token';
const USER_KEY = 'sgd-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<SessionUser | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          const session: SessionUser = {
            id: res.id,
            userName: res.userName,
            role: res.role,
          };
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(session));
          this._user.set(session);
        }),
      );
  }

  profile(): Observable<Usuario> {
    return this.http.get<Usuario>(`${API_URL}/auth/profile`);
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  private readStoredUser(): SessionUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as SessionUser;
      return parsed?.id && parsed?.userName ? parsed : null;
    } catch {
      return null;
    }
  }
}
