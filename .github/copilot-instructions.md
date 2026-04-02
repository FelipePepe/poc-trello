# Copilot Instructions — poc-trello

Clon de Trello: **Angular 21** (frontend) + **Express + TypeScript** (backend) + **OpenAPI 3.0**.

---

## Estructura del proyecto

```
poc-trello/
├── backend/          Express + TypeScript API (port 3000)
│   └── src/
│       ├── models/        Interfaces de dominio + DTOs
│       ├── data/store.ts  In-memory store (→ PostgreSQL via add-postgresql)
│       ├── controllers/   Handlers funcionales (boards, lists, cards)
│       ├── routes/        Express routers (nested + standalone)
│       ├── openapi/       openapi.yaml — spec completo
│       └── app.ts         Entry point, middleware, Swagger UI
│
├── frontend/         Angular 21 standalone (port 4200)
│   └── src/app/
│       ├── models/        Interfaces espejo del backend
│       ├── services/      HttpClient wrappers (Boards, Lists, Cards)
│       └── features/
│           ├── boards/         Listado + CreateBoardDialog
│           ├── board-detail/   Kanban con CDK Drag & Drop
│           └── cards/          CardDetailDialog
│
├── .atl/             Artefactos SDD (skill-registry.md)
└── start-dev.sh      Arranca ambos servidores en paralelo
```

---

## Comandos esenciales

### Backend

```bash
cd backend
npm run dev      # ts-node-dev con hot-reload (desarrollo)
npm run build    # tsc solo — NO ejecutar después de cambios de código
npm start        # node dist/app.js (producción)
```

### Frontend

```bash
cd frontend
ng serve         # Dev server en :4200 con proxy a :3000
ng build         # Build de producción
```

### Combinado

```bash
./start-dev.sh   # Backend + frontend en paralelo
```

> **Regla**: Nunca ejecutar `npm run build` automáticamente después de hacer cambios. El usuario lo ejecuta cuando lo decide.

---

## URLs de desarrollo

| URL                              | Qué es       |
| -------------------------------- | ------------ |
| `http://localhost:4200`          | App Angular  |
| `http://localhost:3000/api-docs` | Swagger UI   |
| `http://localhost:3000/health`   | Health check |

---

## Convenciones de código

### Backend

**Controladores** — funciones exportadas (no clases):

```typescript
export const createBoard = (req: Request, res: Response): void => {
  // Validación inline
  if (!dto.title?.trim()) {
    res.status(400).json({ message: 'Title is required' });
    return;
  }
  // Lógica directa
  store.boards.push(board);
  res.status(201).json(board);
};
```

**Modelos** — interfaces para dominio, Pick/Partial para DTOs:

```typescript
export interface Board {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
export type CreateBoardDto = Pick<Board, 'title' | 'description' | 'background'>;
export type UpdateBoardDto = Partial<CreateBoardDto>;
```

- IDs: UUID v4 (librería `uuid`)
- Timestamps: `new Date().toISOString()` — siempre string ISO 8601
- Sin `any`. TypeScript strict mode activado en ambos proyectos.
- Early returns después de `res.status().json()` — nunca continúa el flujo

**Rutas** — RESTful anidadas + standalone:

- Recursos anidados: `GET /api/boards/:boardId/lists`
- CRUD standalone: `PUT /api/lists/:id`, `DELETE /api/lists/:id`

### Frontend

**Componentes** — standalone, signals, inject():

```typescript
@Component({ standalone: true, imports: [MatButtonModule, ...] })
export class BoardsComponent implements OnInit {
  private service = inject(BoardsService);
  boards = signal<Board[]>([]);
  loading = signal(true);
}
```

- **Siempre standalone** — sin NgModules
- **inject()** en el cuerpo de la clase (no parámetros del constructor)
- **Signals** para estado local (`signal()`, `computed()`)
- **RxJS observables** para llamadas HTTP (`.subscribe({ next, error })`)
- Imports explícitos en cada componente (no shared module)
- Estilos inline en SCSS: `inlineStyleLanguage: 'scss'`

**Servicios** — HttpClient wrappers simples:

```typescript
@Injectable({ providedIn: 'root' })
export class BoardsService {
  private http = inject(HttpClient);
  getAll() {
    return this.http.get<Board[]>('/api/boards');
  }
}
```

---

## Arquitectura y decisiones de diseño

| Decisión            | Valor                                                      |
| ------------------- | ---------------------------------------------------------- |
| Componentes Angular | Standalone (no NgModules)                                  |
| Reactividad         | Signals + RxJS (híbrido — migración pendiente)             |
| Estado global       | Sin store global — servicios + signals locales             |
| Build tool Angular  | esbuild (`@angular/build:application`) — no webpack        |
| Cascade delete      | Hoy: manual en controller. Con DB: FK ON DELETE CASCADE    |
| Labels en Card      | Array embebido (`Label[]`) — mapeará a JSONB en PostgreSQL |
| CORS                | Solo `http://localhost:4200` en desarrollo                 |

---

## Pitfalls conocidos

- **CORS hardcodeado**: `backend/src/app.ts` solo permite `localhost:4200`. Para producción necesita variable de entorno.
- **Sin error handler global**: Express crashea en excepciones no capturadas. No hay middleware `(err, req, res, next)`.
- **In-memory store**: Los datos se pierden al reiniciar el backend. La migración a PostgreSQL es el cambio `add-postgresql` en SDD.
- **Cascade delete manual**: `deleteBoard` filtra arrays de listas y tarjetas a mano. Frágil — FK constraints lo resolvería.
- **Bundle budgets ajustados**: Warning en 500kB / Error en 1MB (inicial). Material + CDK pesan. Revisar antes de subir dependencias.
- **Strict mode en ambos lados**: `strict: true` en backend y frontend. No castear a `any`. Los templates también tienen `strictTemplates: true`.
- **Proxy solo en desarrollo**: `proxy.conf.json` apunta a `:3000`. En producción, el reverse proxy (nginx/etc.) debe manejar `/api`.

---

## SDD (Spec-Driven Development)

Este proyecto usa **SDD con Engram** como backend de persistencia.

> ⚠️ **REGLA OBLIGATORIA**: Todo cambio que implique una feature nueva, refactor significativo o cambio de arquitectura **DEBE pasar por SDD antes de escribir código**. No se implementa nada sin artefactos en Engram.

### Cuándo usar SDD

| Situación                            | Acción                     |
| ------------------------------------ | -------------------------- |
| Bug fix puntual / ajuste de estilos  | Implementar directo        |
| Feature nueva, aunque sea pequeña    | `/sdd-ff <nombre>` primero |
| Cambio que afecta backend + frontend | `/sdd-ff <nombre>` primero |
| Refactor de arquitectura / BD        | `/sdd-ff <nombre>` primero |

> ⚠️ **REGLA DE GIT**: Todo `sdd-apply` DEBE arrancar en una rama `feature/<change-name>`. Cada Phase que compila limpia = un commit inmediato. Ver skill `sdd-git-discipline`.

### Comandos disponibles

| Comando                 | Qué hace                                        |
| ----------------------- | ----------------------------------------------- |
| `/sdd-init`             | Inicializar contexto del proyecto               |
| `/sdd-explore <cambio>` | Investigar un cambio antes de comprometerse     |
| `/sdd-new <cambio>`     | Explore + Proposal                              |
| `/sdd-ff <cambio>`      | Spec + Design + Tasks de una vez (fast-forward) |
| `/sdd-apply <cambio>`   | Implementar tareas                              |
| `/sdd-verify <cambio>`  | Validar que la implementación cumple specs      |
| `/sdd-archive <cambio>` | Archivar cambio completado                      |

### Modo de operación (orquestador)

- Copilot actúa como **orquestador SDD** por defecto: recibe el comando del usuario, coordina fases y consolida resultados.
- Las tareas de ejecución se delegan a subagentes internos cuando corresponda.
- Los subagentes reportan su salida al orquestador (no directamente al usuario).
- El usuario interactúa con una sola conversación: el orquestador traduce estado, riesgos y próximos pasos.

### Cambios activos

| Nombre           | Estado      | Descripción                                             |
| ---------------- | ----------- | ------------------------------------------------------- |
| `add-postgresql` | ✅ COMPLETE | Reemplazar in-memory store con PostgreSQL + Drizzle ORM |

### Artefactos en Engram

| Topic key                           | Artefacto                                 |
| ----------------------------------- | ----------------------------------------- |
| `sdd-init/poc-trello`               | Contexto del proyecto                     |
| `sdd/add-postgresql/explore`        | Exploración (Drizzle vs Prisma vs raw pg) |
| `sdd/add-postgresql/proposal`       | Proposal                                  |
| `sdd/add-postgresql/spec`           | Spec                                      |
| `sdd/add-postgresql/design`         | Design                                    |
| `sdd/add-postgresql/tasks`          | Tasks                                     |
| `sdd/add-postgresql/apply-progress` | Apply progress                            |
