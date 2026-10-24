import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Actividad } from '../core/models/actividad.model';
import { usuarioNombre } from '../core/models/comun.model';
import { ActividadService } from '../core/services/actividad.service';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { TrashService } from '../core/services/trash.service';
import { accionLabel, recursoLabel } from '../core/utils/actividad';
import { formatDateTime } from '../core/utils/format';

const SEEN_KEY = 'sgd-notif-seen';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly trashService = inject(TrashService);
  private readonly actividadService = inject(ActividadService);
  private readonly router = inject(Router);

  readonly notifications = signal<Actividad[]>([]);
  readonly unread = signal(0);
  readonly notificationsOpen = signal(false);
  readonly notificationsLoading = signal(false);

  readonly links = [
    { path: '/', label: 'Documentos', icon: 'folder', exact: true },
    { path: '/compartidos', label: 'Compartidos', icon: 'share', exact: false },
    { path: '/buscar', label: 'Buscar', icon: 'search', exact: false },
    { path: '/papelera', label: 'Papelera', icon: 'trash', exact: false },
    { path: '/reportes', label: 'Reportes', icon: 'report', exact: true },
  ];

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.trashService.refresh();
    this.loadNotifications();
    this.timer = setInterval(() => this.loadNotifications(), 45000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  loadNotifications(): void {
    this.notificationsLoading.set(true);
    this.actividadService.notificaciones({ limit: 20 }).subscribe({
      next: (res) => {
        this.notifications.set(res.items);
        this.computeUnread();
      },
      error: () => this.computeUnread(),
      complete: () => this.notificationsLoading.set(false),
    });
  }

  toggleNotifications(): void {
    const abrir = !this.notificationsOpen();
    this.notificationsOpen.set(abrir);

    if (abrir) {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
      this.unread.set(0);
    }
  }

  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  actorName(item: Actividad): string {
    return usuarioNombre(item.user);
  }

  accion(item: Actividad): string {
    return accionLabel(item.action);
  }

  recurso(item: Actividad): string {
    return recursoLabel(item.resourceType);
  }

  comentarioReportado(item: Actividad): string {
    const texto = item.details?.['comentario'];
    return typeof texto === 'string' ? texto : '';
  }

  fecha(value: string): string {
    return formatDateTime(value);
  }

  logout(): void {
    this.auth.logout();
  }

  goToAdmin(): void {
    void this.router.navigate(['/admin']);
  }

  private computeUnread(): void {
    const seen = localStorage.getItem(SEEN_KEY);
    const desde = seen ? new Date(seen) : new Date(0);
    const count = this.notifications().filter(
      (item) => new Date(item.createdAt).getTime() > desde.getTime(),
    ).length;
    this.unread.set(count);
  }
}
