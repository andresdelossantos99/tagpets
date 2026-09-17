# ARCHITECTURE.md

## 1. Vista general

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

El sistema es un monolito modular: una API NestJS con módulos bien separados y una aplicación Next.js.

---

## 2. Decisiones principales

### Guest checkout

El cliente no necesita registrarse para comprar.

Motivos:
- reduce fricción;
- ayuda al objetivo de compra rápida;
- evita desarrollar recuperación de contraseña, emails de activación y perfiles antes de necesitarlos.

Solo los administradores tienen autenticación en el MVP.

### Carrito en frontend

El carrito se guarda en `localStorage`.

El backend recibe únicamente:
- IDs de producto;
- cantidad;
- personalización.

El backend vuelve a consultar la base de datos y calcula todos los importes.

### Checkout centralizado

`POST /checkout` será el punto de orquestación inicial:

```text
validate request
   |
load products
   |
validate active/stock
   |
validate personalization
   |
calculate subtotal
   |
obtain/validate shipping
   |
create pending order
   |
create Mercado Pago preference
   |
return checkout data
```

### Mercado Pago

Se utilizará Checkout Pro en la primera versión.

Razones:
- integración más simple;
- menor superficie de seguridad;
- no se procesan tarjetas directamente en nuestra aplicación.

El webhook es la fuente confiable para confirmar el estado del pago.

### Envíos

Se define un contrato interno:

```ts
interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingOption[]>;
}
```

El proveedor concreto se decide cuando se conozca la empresa de logística.

De esta forma el dominio no queda acoplado a Correo Argentino, Andreani, OCA u otro servicio.

---

## 3. Módulos backend

### products
Responsable de:
- productos;
- imágenes;
- precios;
- stock;
- estado activo;
- configuración de personalización.

### categories
Responsable de:
- categorías;
- slugs;
- orden de visualización;
- activación/desactivación.

### orders
Responsable de:
- creación de pedidos;
- snapshots;
- estados;
- consulta administrativa;
- datos de comprador y dirección.

### payments
Responsable de:
- creación de preferencias;
- webhooks;
- eventos de pago;
- idempotencia;
- actualización de `Payment` y `Order`.

### shipping
Responsable de:
- cotizaciones;
- normalización de opciones de envío;
- integración con proveedor.

### auth
Responsable únicamente de administradores en el MVP.

### settings
Responsable de:
- WhatsApp;
- redes sociales;
- email de contacto;
- datos básicos de tienda.

---

## 4. Flujo de compra

```text
PRODUCT PAGE
   |
personalization
   |
ADD TO CART
   |
CART
   |
postal code / address
   |
SHIPPING QUOTE
   |
CHECKOUT
   |
POST /checkout
   |
PENDING ORDER
   |
MERCADO PAGO
   |
WEBHOOK
   |
PAID ORDER
   |
ADMIN PREPARES ORDER
```

---

## 5. Reglas de integridad

### Precio
El frontend nunca decide el precio final.

### Personalización
Debe validarse en backend y persistirse como snapshot en `OrderItem`.

### Pago
El redirect de Mercado Pago no confirma una compra. La confirmación final depende del webhook o de una verificación server-to-server.

### Webhook
Cada evento externo debe poder procesarse más de una vez sin duplicar efectos.

### Stock
El descuento ocurre al confirmar pago, dentro de una transacción y con verificación de stock.

### Borrado
Los productos comprados nunca deben desaparecer de pedidos históricos. Se prefieren `active=false` o soft delete.

---

## 6. Seguridad mínima

- `ValidationPipe` global.
- DTOs.
- CORS restringido por ambiente.
- Helmet.
- Rate limiting en endpoints sensibles.
- Password hashing seguro para admin.
- JWT de administración.
- Secrets únicamente en variables de entorno.
- Verificación de webhook.
- No registrar contraseñas ni datos sensibles.
- No aceptar estados de pago enviados por frontend.
- No aceptar totales calculados por frontend.

---

## 7. Variables de entorno previstas

```env
DATABASE_URL=
PORT=
FRONTEND_URL=

JWT_ADMIN_SECRET=

MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=

SHIPPING_PROVIDER=
SHIPPING_API_KEY=
SHIPPING_ORIGIN_POSTAL_CODE=

IMAGE_PROVIDER=
IMAGE_PROVIDER_KEY=
```

No todas se crearán en la primera etapa. Solo agregar variables cuando sean necesarias.
