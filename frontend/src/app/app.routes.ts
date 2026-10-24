import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
    title: 'Iniciar sesión · SisGesDoc',
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./admin/admin').then((m) => m.Admin),
    title: 'Panel de administración · SisGesDoc',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./carpetas/carpetas').then((m) => m.Carpetas),
        title: 'Documentos · SisGesDoc',
      },
      {
        path: 'carpetas/:id',
        loadComponent: () =>
          import('./carpetas/carpetas').then((m) => m.Carpetas),
        title: 'Carpeta · SisGesDoc',
      },
      {
        path: 'archivos/:id',
        loadComponent: () =>
          import('./archivos/archivos').then((m) => m.Archivos),
        title: 'Archivo · SisGesDoc',
      },
      {
        path: 'compartidos',
        loadComponent: () =>
          import('./compartidos/compartidos').then((m) => m.Compartidos),
        title: 'Compartidos conmigo · SisGesDoc',
      },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./buscar/buscar').then((m) => m.Buscar),
        title: 'Buscar · SisGesDoc',
      },
      {
        path: 'papelera',
        loadComponent: () =>
          import('./papelera/papelera').then((m) => m.Papelera),
        title: 'Papelera · SisGesDoc',
      },
      {
        path: 'actividades',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./actividades/actividades').then((m) => m.Actividades),
        title: 'Actividades · SisGesDoc',
      },
      {
        path: 'reportes/comentarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./reportes-comentarios/reportes-comentarios').then(
            (m) => m.ReportesComentarios,
          ),
        title: 'Comentarios reportados · SisGesDoc',
      },
      {
        path: 'reportes',
        pathMatch: 'full',
        loadComponent: () =>
          import('./reportes/reportes').then((m) => m.Reportes),
        title: 'Reportes · SisGesDoc',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
