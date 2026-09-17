# PROJECT_CONTEXT.md

## 1. Proyecto

**Nombre de trabajo:** PetTag E-commerce  
**Estado:** proyecto de portfolio / posible base para un cliente real.  
**Objetivo:** construir una tienda online mobile-first para vender chapitas personalizadas para mascotas.

La marca definitiva todavía no está definida. No acoplar nombres de clases, módulos, rutas o variables a "TagPet" salvo textos visibles fácilmente reemplazables.

---

## 2. Requerimientos de negocio

La tienda debe permitir:

- navegar productos y categorías;
- ver el detalle de un producto;
- ingresar los datos que se grabarán en la chapita antes de agregarla al carrito;
- guardar esa personalización junto con el ítem;
- comprar con la menor fricción posible, sin obligar al cliente a crear una cuenta;
- calcular el envío automáticamente;
- pagar mediante una pasarela de pagos;
- mostrar WhatsApp y redes sociales;
- permitir que un administrador gestione productos, precios, stock, categorías y pedidos.

La personalización es crítica. Nunca debe perderse entre producto, carrito, checkout, orden y panel administrativo.

---

## 3. Stack acordado

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- App Router
- React Hook Form
- Zod para validaciones de formularios cuando aporte valor

### Backend
- Node.js
- TypeScript
- NestJS
- REST API
- Prisma ORM
- PostgreSQL

### Integraciones
- Mercado Pago como primera pasarela
- Proveedor de envíos: por definir
- Imágenes: proveedor externo por definir; inicialmente se trabajará con URLs

### Deploy
- Frontend: Vercel
- Backend: proveedor Node compatible
- PostgreSQL: servicio administrado

No introducir Docker, Redis, colas externas, microservicios, GraphQL, CQRS, Kafka, RabbitMQ o Kubernetes salvo que una necesidad real lo justifique.

---

## 4. Arquitectura

Arquitectura principal: **monolito modular**.

El frontend y el backend son aplicaciones separadas dentro del mismo proyecto o repositorio, pero el backend mantiene sus límites por dominio.

Módulos backend previstos:

- auth
- products
- categories
- orders
- payments
- shipping
- settings
- health

No existe módulo de usuarios de cliente en el MVP. El checkout es como invitado.

El carrito del MVP vive en el frontend y se persiste en `localStorage`. El backend nunca confía en precios, totales, stock ni costos enviados por el frontend: los recalcula y valida.

---

## 5. Principios de backend

- Controllers finos.
- La lógica de negocio vive en services.
- Acceso a base de datos encapsulado mediante Prisma.
- DTOs y validación para toda entrada externa.
- El backend calcula precios y totales.
- No confiar en IDs, precios, stock, estados de pago ni totales enviados por el cliente.
- Las operaciones críticas deben ser idempotentes cuando corresponda.
- Los webhooks deben validar autenticidad y evitar procesamiento duplicado.
- Los cambios de stock y estado de pago deben ejecutarse transaccionalmente cuando corresponda.
- Los pedidos guardan snapshots históricos de nombre de producto, precio y personalización.
- Evitar dependencias innecesarias.
- Preferir código explícito y mantenible antes que abstracciones prematuras.

---

## 6. Personalización de productos

La configuración de personalización se guarda en `Product.personalizationConfig` como JSON.

Ejemplo:

```json
{
  "enabled": true,
  "fields": [
    {
      "key": "petName",
      "label": "Nombre de la mascota",
      "type": "text",
      "required": true,
      "maxLength": 20
    },
    {
      "key": "phone",
      "label": "Teléfono",
      "type": "tel",
      "required": true,
      "maxLength": 20
    }
  ]
}
```

Cuando el cliente compra, los valores finales se guardan en `OrderItem.personalization` como snapshot.

Ejemplo:

```json
{
  "petName": "Milo",
  "phone": "2804123456"
}
```

El backend debe validar esos valores contra la configuración vigente del producto antes de crear la orden.

---

## 7. Estrategia de carrito y checkout

El carrito no se guarda inicialmente en PostgreSQL.

Estructura conceptual de un ítem:

```ts
type CartItem = {
  productId: string;
  quantity: number;
  personalization?: Record<string, string>;
};
```

Flujo:

1. Frontend arma el carrito.
2. Frontend solicita cotización de envío.
3. Frontend envía productos, cantidades, personalización y dirección al backend.
4. Backend vuelve a consultar productos y precios.
5. Backend valida stock, personalización y envío.
6. Backend calcula subtotal, envío y total.
7. Backend crea una orden `PENDING_PAYMENT`.
8. Backend crea la preferencia de Mercado Pago.
9. Usuario paga en Mercado Pago.
10. Webhook confirma el pago.
11. Backend actualiza la orden y el stock.

---

## 8. Política de stock del MVP

Para el MVP:

- validar stock antes de crear la orden;
- descontar stock únicamente cuando el pago sea confirmado;
- realizar el descuento dentro de una transacción;
- nunca permitir stock negativo.

Este enfoque es suficiente para una tienda pequeña, pero no garantiza una reserva estricta de stock durante el proceso de pago. Si el volumen real exige reservas, se diseñará una etapa posterior.

---

## 9. Estructuras de datos

Usar estructuras nativas del lenguaje cuando corresponda:

- `Array`: colecciones ordenadas como items de carrito y resultados.
- `Map` / objetos: acceso temporal por clave.
- `Set`: deduplicación cuando sea necesario.

No implementar manualmente Linked Lists, Stacks, Queues, Deques, Hash Tables o Trees para resolver problemas ya cubiertos por JavaScript, PostgreSQL o librerías.

Una cola externa solo se incorporará si aparecen tareas asíncronas reales que requieran procesamiento desacoplado o reintentos.

---

## 10. API pública prevista

- `GET /health`
- `GET /categories`
- `GET /products`
- `GET /products/:slug`
- `POST /shipping/quote`
- `POST /checkout`
- `POST /webhooks/mercadopago`

## 11. API administrativa prevista

- `POST /admin/auth/login`
- `GET /admin/products`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `DELETE /admin/products/:id` (soft delete o desactivación)
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PATCH /admin/orders/:id/status`
- `GET /admin/settings`
- `PATCH /admin/settings`

Las rutas exactas pueden ajustarse durante la implementación, pero no cambiar el dominio sin documentar la decisión.

---

## 12. Reglas para Claude

Cuando trabajes sobre este proyecto:

1. Trabajá únicamente sobre la etapa solicitada.
2. No implementes funcionalidades de etapas futuras.
3. Antes de escribir código, indicá en pocas líneas qué archivos vas a crear o modificar.
4. No modifiques archivos fuera del alcance sin justificarlo.
5. No agregues dependencias sin explicar por qué son necesarias.
6. Reutilizá la arquitectura y convenciones existentes.
7. No refactorices código no relacionado.
8. Mantené TypeScript estricto.
9. No generes explicaciones largas.
10. Al terminar, respondé únicamente con:
   - archivos creados/modificados;
   - resumen breve;
   - comandos que debo ejecutar;
   - variables de entorno nuevas;
   - pruebas manuales para verificar la etapa.
11. Si una decisión importante no está definida, detenete y hacé una sola pregunta concreta.
12. No inventes credenciales, URLs, IDs de proveedores ni valores de negocio.

---

## 13. Definición de terminado

Una etapa está terminada cuando:

- compila;
- no introduce errores TypeScript;
- cumple solamente el alcance pedido;
- tiene validaciones necesarias;
- incluye instrucciones de prueba;
- no rompe funcionalidades anteriores.

No avanzar de etapa hasta comprobar manualmente la anterior.
