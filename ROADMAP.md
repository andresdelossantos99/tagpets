# ROADMAP.md

## Regla principal

Cada etapa debe ser pequeña, comprobable y autocontenida.

Antes de pedir una nueva etapa a Claude:
1. ejecutar el proyecto;
2. probar manualmente la etapa actual;
3. corregir errores;
4. hacer commit.

---

## Etapa 0 — Inicialización

Objetivo:
- crear repositorio;
- crear `backend/`;
- crear `frontend/`;
- agregar documentos de contexto;
- configurar `.gitignore`, `.editorconfig` y README mínimo.

No implementar negocio.

**Commit sugerido:** `chore: initialize project structure`

---

## Etapa 1 — Bootstrap de NestJS

Objetivo:
- crear backend NestJS;
- TypeScript strict;
- configuración por variables de entorno;
- `ValidationPipe`;
- endpoint `GET /health`;
- estructura modular inicial.

No agregar Prisma todavía.

**Commit:** `feat(api): bootstrap nest application`

---

## Etapa 2 — PostgreSQL + Prisma + modelo base

Objetivo:
- instalar Prisma;
- configurar PostgreSQL;
- crear schema inicial;
- primera migración;
- PrismaService;
- verificar conexión.

Modelos iniciales:
- AdminUser
- Category
- Product
- ProductImage
- Order
- OrderItem
- Payment
- PaymentEvent
- StoreSettings

**Commit:** `feat(db): add prisma schema and initial migration`

---

## Etapa 3 — Catálogo: categorías

Objetivo:
- módulo categories;
- endpoints públicos de lectura;
- CRUD administrativo;
- DTOs;
- validaciones;
- slug único;
- active/sortOrder.

Sin autenticación todavía: rutas admin pueden quedar preparadas pero se protegen en una etapa posterior.

**Commit:** `feat(categories): add category management`

---

## Etapa 4 — Catálogo: productos

Objetivo:
- módulo products;
- CRUD;
- imágenes;
- precio;
- stock;
- dimensiones/peso;
- filtros básicos;
- paginación;
- endpoints públicos por slug.

**Commit:** `feat(products): add product catalog`

---

## Etapa 5 — Personalización

Objetivo:
- definir el contrato de `personalizationConfig`;
- validar configuración de producto;
- validar payload de personalización;
- tests unitarios de reglas críticas.

Casos:
- campo requerido;
- maxLength;
- tipo text/tel;
- producto sin personalización;
- campos desconocidos.

**Commit:** `feat(products): add product personalization rules`

---

## Etapa 6 — Shipping abstraction

Objetivo:
- crear módulo shipping;
- `ShippingProvider` interface;
- DTO de cotización;
- endpoint `POST /shipping/quote`;
- implementación mock temporal para desarrollo.

No integrar un proveedor real hasta decidir cuál se utilizará.

**Commit:** `feat(shipping): add provider abstraction and quote endpoint`

---

## Etapa 7 — Creación de órdenes / checkout

Objetivo:
- `POST /checkout`;
- cargar productos desde DB;
- ignorar precios del frontend;
- validar active/stock;
- validar personalización;
- calcular subtotal;
- calcular envío;
- calcular total;
- crear Order + OrderItems en transacción;
- estado inicial `PENDING_PAYMENT`.

Todavía sin Mercado Pago real.

**Commit:** `feat(orders): create validated checkout orders`

---

## Etapa 8 — Mercado Pago

Objetivo:
- SDK/API Mercado Pago;
- crear preferencia;
- asociar preferenceId;
- URLs success/failure/pending;
- no marcar pago como aprobado desde redirect.

**Commit:** `feat(payments): add mercado pago checkout`

---

## Etapa 9 — Webhook e idempotencia

Objetivo:
- endpoint webhook;
- verificar evento;
- `PaymentEvent`;
- evitar duplicados;
- obtener estado real del pago;
- actualizar Payment;
- actualizar Order;
- descontar stock en transacción;
- nunca permitir stock negativo.

Esta es una de las etapas más críticas.

**Commit:** `feat(payments): process payment webhooks idempotently`

---

## Etapa 10 — Auth administrativa

Objetivo:
- login admin;
- hash de contraseña;
- JWT;
- guard;
- proteger rutas `/admin/*`;
- seed inicial de administrador.

No crear registro público.

**Commit:** `feat(auth): protect admin endpoints`

---

## Etapa 11 — Gestión de pedidos

Objetivo:
- listar pedidos;
- detalle;
- filtros por estado/fecha;
- ver personalización;
- cambiar `PAID -> PREPARING -> SHIPPED -> DELIVERED`;
- tracking code.

**Commit:** `feat(orders): add admin order workflow`

---

## Etapa 12 — Store settings

Objetivo:
- WhatsApp;
- redes sociales;
- email;
- código postal de origen;
- endpoints público/admin.

**Commit:** `feat(settings): add store contact settings`

---

## Etapa 13 — Frontend público

Objetivo:
- Next.js + Tailwind;
- home;
- catálogo;
- categorías;
- detalle de producto;
- responsive mobile-first.

Todavía sin checkout completo.

**Commit:** `feat(web): add public storefront`

---

## Etapa 14 — Carrito + personalización

Objetivo:
- formulario dinámico desde `personalizationConfig`;
- carrito localStorage;
- editar/eliminar ítems;
- misma chapita con distintas personalizaciones debe poder existir como ítems distintos;
- resumen de compra.

**Commit:** `feat(web): add personalized shopping cart`

---

## Etapa 15 — Checkout + envío

Objetivo:
- datos del comprador;
- dirección;
- cotización;
- selección de envío;
- `POST /checkout`;
- manejo de errores.

**Commit:** `feat(web): add checkout flow`

---

## Etapa 16 — Pago y resultados

Objetivo:
- redirección Mercado Pago;
- páginas success/failure/pending;
- success no afirma pago sin confirmación del backend;
- vista de número de orden.

**Commit:** `feat(web): add payment result flow`

---

## Etapa 17 — Panel admin frontend

Objetivo:
- login;
- productos;
- categorías;
- stock;
- pedidos;
- datos de grabado;
- settings.

**Commit:** `feat(admin): add store administration UI`

---

## Etapa 18 — Proveedor real de envíos

Objetivo:
- reemplazar mock por adapter real;
- timeouts;
- errores externos;
- normalizar respuestas;
- fallback definido.

Solo puede comenzar cuando se conozca el proveedor.

**Commit:** `feat(shipping): integrate shipping provider`

---

## Etapa 19 — Hardening y tests críticos

Prioridad:
- checkout;
- cálculo de totales;
- personalización;
- webhook duplicado;
- stock;
- permisos admin;
- validaciones;
- errores de integraciones.

Agregar:
- rate limiting;
- Helmet;
- logging;
- manejo global de errores.

**Commit:** `test: cover critical ecommerce flows`

---

## Etapa 20 — Deploy

Objetivo:
- PostgreSQL producción;
- API;
- frontend;
- variables de entorno;
- webhook de producción;
- CORS;
- dominio;
- prueba end-to-end real.

**Commit:** `chore: prepare production deployment`

---

## Estrategia de prompts para Claude gratuito

Cada prompt debe incluir únicamente:

```text
1. Leé PROJECT_CONTEXT.md.
2. Leé el documento específico de esta etapa si corresponde.
3. Estado actual del proyecto.
4. Objetivo único de la etapa.
5. Criterios de aceptación.
6. Restricciones.
7. Formato de respuesta corto.
```

Evitar pegar en cada conversación:
- toda la arquitectura;
- todo el schema;
- etapas futuras;
- explicaciones conceptuales ya documentadas.

Claude debe leer los archivos locales que ya contienen esa información.
