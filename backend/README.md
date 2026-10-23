# Sistema de Gestión Documental — Backend

API REST desarrollada con NestJS + MongoDB (Mongoose). Prefijo global: `/sisgesdoc`.

## Puesta en marcha

```bash
# 1. Base de datos (puerto 27018)
docker compose up -d

# 2. Dependencias
yarn install

# 3. Carga inicial (3 usuarios, 50 archivos, comparticiones, papelera e historial)
yarn seed

# 4. Ejecución
yarn start:dev
```

Credenciales de prueba creadas por el seed:

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `password123` | admin |
| `juan` | `password123` | user |
| `maria` | `password123` | user |

## Modelo documental

- `usuarios`: credenciales, rol y estado. La desactivación es lógica (`status: false`) para conservar el historial.
- `archivos`: metadatos, propietario, carpeta padre, `ancestors`, tamaño y `content` como texto plano. El contenido no se guarda como ruta local.
- `carpetas`: jerarquía mediante `parentFolder` + `ancestors`, propietario, tamaño calculado y estado de papelera.
- `permisos` y `comentarios`: documentos embebidos en archivos y carpetas. Los permisos se calculan de forma efectiva comprobando el recurso y todos sus `ancestors`, por lo que compartir una carpeta hereda el acceso a su contenido.
- `actividads`: colección independiente para auditoría y reportes (`user`, `action`, `resourceType`, `resourceId`, `resourceName`, `details`, fechas).

La papelera usa `inTrash` para el recurso eliminado e `isVisible` para ocultar sus descendientes. La restauración recalcula la visibilidad y los tamaños de las carpetas afectadas.

## Endpoints principales

Todas las rutas requieren `Authorization: Bearer <token>` salvo `POST /auth/login`.

### Autenticación y usuarios
- `POST /auth/login`
- `GET /auth/profile`
- `GET|POST /usuario` (admin)
- `GET|PATCH|DELETE /usuario/:id` (admin)

### Carpetas
- `GET /carpeta` — filtros `q`, `parentFolder`, `page`, `limit`
- `POST /carpeta`
- `GET /carpeta/:id` — metadatos, subcarpetas y archivos
- `PATCH /carpeta/:id` — renombrar
- `PATCH /carpeta/:id/mover`
- `DELETE /carpeta/:id` — enviar a papelera
- `GET /carpeta/papelera`
- `PATCH /carpeta/:id/restaurar`
- `DELETE /carpeta/:id/permanente`
- `GET|POST /carpeta/:id/compartir`
- `PATCH|DELETE /carpeta/:id/compartir/:userId`
- `GET /carpeta/recibidas`

### Archivos
- `GET /archivo` — filtros `q`, `type`, `parentFolder`, `desde`, `hasta`, `sort`, `page`, `limit`
- `POST /archivo` — `{ name, content, type?, parentFolder? }` (solo `.txt` y `.md`)
- `GET /archivo/:id`
- `GET /archivo/:id/descargar`
- `PATCH /archivo/:id` — renombrar y/o editar contenido
- `PATCH /archivo/:id/mover`
- `DELETE /archivo/:id` — enviar a papelera
- `GET /archivo/papelera`
- `PATCH /archivo/:id/restaurar`
- `DELETE /archivo/:id/permanente`
- `GET|POST /archivo/:id/compartir`
- `PATCH|DELETE /archivo/:id/compartir/:userId`
- `GET /archivo/recibidos`

### Comentarios
- `GET|POST /comentarios/archivo/:id`
- `DELETE /comentarios/archivo/:id/:comentarioId`
- `GET|POST /comentarios/carpeta/:id`
- `DELETE /comentarios/carpeta/:id/:comentarioId`

### Historial
- `GET /actividad` — admin, filtros `userId`, `action`, `resourceType`, `resourceId`, `desde`, `hasta`
- `GET /actividad/mios` — admin
- `GET /actividad/usuario/:id` — admin

### Reportes
- `GET /reportes/archivos/por-tipo`
- `GET /reportes/archivos/rango-fechas?desde=&hasta=`
- `GET /reportes/archivos/mas-operaciones`
- `GET /reportes/usuarios/top-archivos`
- `GET /reportes/usuarios/mas-compartidos`
- `GET /reportes/comparticion/archivos-mas-usuarios`
- `GET /reportes/comparticion/por-usuario/:id`
- `GET /reportes/comparticion/recibidos/:id`
- `GET /reportes/actividad/usuario/:id?desde=&hasta=` — admin (historial detallado)
- `GET /reportes/actividad/por-tipo`
- `GET /reportes/actividad/por-periodo?unidad=dia|mes|anio`
- `GET /reportes/actividad/principales-acciones`

## Decisiones pendientes de la fase de infraestructura

Por indicación del proyecto, todavía no se incluyen: `ConfigModule`/`.env`, CORS, filtro global de excepciones ni índices explícitos adicionales.
