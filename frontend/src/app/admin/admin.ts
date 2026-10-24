import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Role, Usuario } from '../core/models/usuario.model';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { UsuarioService } from '../core/services/usuario.service';
import { extractHttpError } from '../core/utils/http-error';

type StatusFilter = 'all' | 'active' | 'inactive';
type RoleFilter = 'all' | Role;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly auth = inject(AuthService);
  readonly themeService = inject(ThemeService);

  readonly users = signal<Usuario[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal('');

  readonly search = signal('');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly createOpen = signal(false);
  readonly editUser = signal<Usuario | null>(null);
  readonly modalError = signal('');

  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  readonly total = computed(() => this.users().length);
  readonly activeCount = computed(
    () => this.users().filter((u) => u.status).length,
  );
  readonly inactiveCount = computed(
    () => this.users().filter((u) => !u.status).length,
  );
  readonly adminCount = computed(
    () => this.users().filter((u) => u.role === 'admin').length,
  );

  readonly filteredUsers = computed(() => {
    const query = this.search().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter((user) => {
      const haystack = `${user.name} ${user.lastname} ${user.username}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesRole = role === 'all' || user.role === role;
      const matchesStatus =
        status === 'all' || (status === 'active' ? user.status : !user.status);

      return matchesQuery && matchesRole && matchesStatus;
    });
  });

  readonly createForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required]],
    lastname: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    role: this.fb.nonNullable.control<Role>('user'),
    status: this.fb.nonNullable.control(true),
  });

  readonly editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    lastname: ['', [Validators.required]],
    password: [''],
    role: this.fb.nonNullable.control<Role>('user'),
    status: this.fb.nonNullable.control(true),
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.usuarioService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.users.set(this.sortUsers(users)),
        error: (err) =>
          this.loadError.set(
            extractHttpError(err, 'No se pudieron cargar los usuarios'),
          ),
      });
  }

  initials(user: Usuario): string {
    return `${user.name?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase();
  }

  fullName(user: Usuario): string {
    return `${user.name} ${user.lastname}`.trim();
  }

  isCurrentUser(user: Usuario): boolean {
    return user._id === this.auth.user()?.id;
  }

  roleLabel(role: Role): string {
    return role === 'admin' ? 'Administrador' : 'Usuario';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  openCreate(): void {
    this.createForm.reset({
      username: '',
      name: '',
      lastname: '',
      password: '',
      role: 'user',
      status: true,
    });
    this.modalError.set('');
    this.createOpen.set(true);
  }

  closeCreate(): void {
    if (this.saving()) return;
    this.createOpen.set(false);
    this.modalError.set('');
  }

  openEdit(user: Usuario): void {
    this.editForm.reset({
      name: user.name,
      lastname: user.lastname,
      password: '',
      role: user.role,
      status: user.status,
    });
    this.modalError.set('');
    this.editUser.set(user);
  }

  closeEdit(): void {
    if (this.saving()) return;
    this.editUser.set(null);
    this.modalError.set('');
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.modalError.set('');

    const value = this.createForm.getRawValue();

    this.usuarioService
      .create({
        username: value.username.trim(),
        name: value.name.trim(),
        lastname: value.lastname.trim(),
        password: value.password,
        role: value.role,
        status: value.status,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (created) => {
          this.users.update((users) =>
            this.sortUsers([...users, created]),
          );
          this.createOpen.set(false);
          this.showToast('Usuario creado correctamente', 'success');
        },
        error: (err) =>
          this.modalError.set(
            extractHttpError(err, 'No se pudo crear el usuario'),
          ),
      });
  }

  submitEdit(): void {
    const user = this.editUser();
    if (!user) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();

    if (user._id === this.auth.user()?.id && value.status === false) {
      this.modalError.set('No puedes desactivar tu propia cuenta');
      return;
    }

    this.saving.set(true);
    this.modalError.set('');

    this.usuarioService
      .update(user._id, {
        name: value.name.trim(),
        lastname: value.lastname.trim(),
        role: value.role,
        status: value.status,
        ...(value.password.trim() ? { password: value.password } : {}),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.users.update((users) =>
            this.sortUsers(
              users.map((u) => (u._id === updated._id ? updated : u)),
            ),
          );
          this.editUser.set(null);
          this.showToast('Usuario actualizado correctamente', 'success');
        },
        error: (err) =>
          this.modalError.set(
            extractHttpError(err, 'No se pudo actualizar el usuario'),
          ),
      });
  }

  toggleStatus(user: Usuario): void {
    if (this.isCurrentUser(user)) {
      this.showToast('No puedes desactivar tu propia cuenta', 'error');
      return;
    }

    const nextStatus = !user.status;

    this.usuarioService.update(user._id, { status: nextStatus }).subscribe({
      next: (updated) => {
        this.users.update((users) =>
          this.sortUsers(
            users.map((u) => (u._id === updated._id ? updated : u)),
          ),
        );
        this.showToast(
          nextStatus ? 'Usuario activado' : 'Usuario desactivado',
          'success',
        );
      },
      error: (err) =>
        this.showToast(
          extractHttpError(err, 'No se pudo cambiar el estado'),
          'error',
        ),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }

  goReportesComentarios(): void {
    void this.router.navigate(['/reportes/comentarios']);
  }

  goReportesGenerales(): void {
    void this.router.navigate(['/reportes']);
  }

  goActividades(): void {
    void this.router.navigate(['/actividades']);
  }

  clearFilters(): void {
    this.search.set('');
    this.roleFilter.set('all');
    this.statusFilter.set('all');
  }

  private sortUsers(users: Usuario[]): Usuario[] {
    return [...users].sort((a, b) =>
      `${a.name} ${a.lastname}`.localeCompare(`${b.name} ${b.lastname}`, 'es'),
    );
  }

  private showToast(
    message: string,
    type: 'success' | 'error',
  ): void {
    this.toast.set({ message, type });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }
}
