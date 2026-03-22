# POC Trello Clone

Clon de Trello construido con **Angular 21** + **TypeScript REST API** con **OpenAPI/Swagger**.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21, Angular Material, Angular CDK (Drag & Drop), Standalone Components, Signals |
| Backend | Node.js, TypeScript, Express, YAML OpenAPI 3.0 |
| Docs API | Swagger UI |

## Estructura

```
poc-trello/
├── backend/                    # Express + TypeScript API
│   └── src/
│       ├── models/             # Interfaces (Board, List, Card, Label)
│       ├── data/store.ts       # In-memory store con seed data
│       ├── controllers/        # Boards, Lists, Cards
│       ├── routes/             # Express routers
│       ├── openapi/            # openapi.yaml spec completo
│       └── app.ts              # Entry point + Swagger UI
│
└── frontend/                   # Angular 21
    └── src/app/
        ├── models/             # Interfaces tipadas
        ├── services/           # HTTP services (Boards, Lists, Cards)
        └── features/
            ├── boards/         # Listado y creación de tableros
            ├── board-detail/   # Tablero con drag & drop CDK
            └── cards/          # Card detail dialog con labels y fecha
```

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/boards` | Listar tableros |
| POST | `/api/boards` | Crear tablero |
| GET | `/api/boards/:id` | Obtener tablero |
| PUT | `/api/boards/:id` | Actualizar tablero |
| DELETE | `/api/boards/:id` | Eliminar tablero (cascade) |
| GET | `/api/boards/:boardId/lists` | Listas del tablero |
| POST | `/api/boards/:boardId/lists` | Crear lista |
| PATCH | `/api/boards/:boardId/lists/reorder` | Reordenar listas |
| PUT | `/api/lists/:id` | Actualizar lista |
| DELETE | `/api/lists/:id` | Eliminar lista (cascade) |
| GET | `/api/lists/:listId/cards` | Tarjetas de la lista |
| POST | `/api/lists/:listId/cards` | Crear tarjeta |
| PATCH | `/api/lists/:listId/cards/reorder` | Reordenar tarjetas |
| GET | `/api/cards/:id` | Obtener tarjeta |
| PUT | `/api/cards/:id` | Actualizar tarjeta |
| DELETE | `/api/cards/:id` | Eliminar tarjeta |
| PATCH | `/api/cards/:id/move` | Mover tarjeta a otra lista |

## Inicio rápido

```bash
# Opción 1 — Script combinado
./start-dev.sh

# Opción 2 — Manual
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && ng serve
```

## URLs

- **App**: http://localhost:4200
- **Swagger UI**: http://localhost:3000/api-docs
- **Health**: http://localhost:3000/health

## Features

- ✅ CRUD completo de tableros (con color de fondo personalizable)
- ✅ CRUD de listas dentro de cada tablero
- ✅ CRUD de tarjetas con título, descripción, etiquetas y fecha límite
- ✅ Drag & Drop de tarjetas entre listas (Angular CDK)
- ✅ Drag & Drop de listas horizontalmente
- ✅ Mover tarjeta a otra lista desde el dialog
- ✅ 8 etiquetas predefinidas con colores
- ✅ OpenAPI 3.0 spec completo + Swagger UI interactivo
- ✅ Lazy loading de rutas (Board y BoardDetail separados)
- ✅ Angular Signals para estado reactivo
- ✅ CORS configurado + proxy para desarrollo
