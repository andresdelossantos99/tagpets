# PetTag E-commerce

> Nombre de trabajo. La marca definitiva todavía no está definida.

Tienda online **mobile-first** para vender chapitas personalizadas para mascotas. Es un proyecto de portfolio con potencial de convertirse en base para un cliente real.

La tienda permitirá navegar productos y categorías, personalizar una chapita antes de agregarla al carrito, comprar sin necesidad de crear una cuenta (guest checkout), cotizar el envío automáticamente y pagar a través de una pasarela de pagos. La personalización ingresada por el cliente es un dato crítico del negocio y debe preservarse de forma consistente entre el producto, el carrito, el checkout, la orden y el panel administrativo.

## Arquitectura general

El proyecto sigue una arquitectura de **monolito modular**: una aplicación Next.js (frontend) y una API REST en NestJS (backend), separadas dentro del mismo repositorio.

```text
[ Browser / Mobile ]
        |
        v
[ Next.js Frontend ]
        |
        | HTTPS / JSON
        v
[ NestJS REST API ]
        |
        +--------------------+
        |                    |
        v                    v
[ PostgreSQL ]       [ External services ]
                     - Mercado Pago
                     - Shipping provider
                     - Image provider
```

Decisiones de arquitectura relevantes:

- **Guest checkout**: no existe módulo de usuarios de cliente en el MVP; solo los administradores se autentican.
- **Carrito en el frontend**: se arma y persiste en `localStorage`. El backend nunca confía en precios, totales, stock ni costos enviados por el cliente: siempre los recalcula y valida contra la base de datos.
- **Checkout centralizado**: `POST /checkout` orquesta validación de productos, stock y personalización, cálculo de subtotal y envío, y creación de la orden junto con la preferencia de pago.
- **Pagos con Mercado Pago (Checkout Pro)**: el webhook es la fuente confiable para confirmar el estado del pago; el redirect por sí solo no confirma una compra.
- **Envíos desacoplados**: se define una interfaz `ShippingProvider` para no acoplar el dominio a un proveedor de logística concreto.
- **Sin infraestructura innecesaria**: no se incorporan Docker, Redis, colas externas, microservicios, GraphQL, CQRS, Kafka, RabbitMQ ni Kubernetes salvo que una necesidad real lo justifique.

Para el detalle completo de decisiones, módulos y reglas de integridad, ver [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Separación frontend / backend

```text
/
├── frontend/   # Aplicación Next.js (storefront + panel admin)
├── backend/    # API REST NestJS (dominio, persistencia e integraciones)
```

Módulos backend previstos (por dominio): `auth`, `products`, `categories`, `orders`, `payments`, `shipping`, `settings`, `health`.

## Stack tecnológico

**Frontend**

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod (validaciones de formularios cuando aporte valor)

**Backend**

- Node.js
- TypeScript
- NestJS
- REST API
- Prisma ORM
- PostgreSQL

**Integraciones**

- Mercado Pago (primera pasarela de pagos)
- Proveedor de envíos: por definir
-
