# DATA_MODEL.md

## 1. Objetivo

Modelo relacional para PostgreSQL usando Prisma.

No incluye cuentas de clientes ni carritos persistidos en el MVP.

---

## 2. Entidades

### AdminUser

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| name | String | requerido |
| email | String | unique |
| passwordHash | String | requerido |
| role | AdminRole | default ADMIN |
| active | Boolean | default true |
| lastLoginAt | DateTime? | opcional |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### Category

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| name | String | requerido |
| slug | String | unique |
| description | String? | opcional |
| active | Boolean | default true |
| sortOrder | Int | default 0 |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Relación:
- una categoría tiene muchos productos.

---

### Product

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| categoryId | UUID? | FK |
| name | String | requerido |
| slug | String | unique |
| sku | String | unique |
| description | String | requerido |
| price | Decimal(12,2) | >= 0 |
| stock | Int | >= 0 |
| active | Boolean | default true |
| featured | Boolean | default false |
| personalizationConfig | Json? | opcional |
| weightGrams | Int? | para envío |
| lengthCm | Decimal? | opcional |
| widthCm | Decimal? | opcional |
| heightCm | Decimal? | opcional |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Índices sugeridos:
- slug;
- sku;
- categoryId;
- active;
- featured.

---

### ProductImage

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| productId | UUID | FK |
| url | String | requerido |
| altText | String? | opcional |
| sortOrder | Int | default 0 |
| createdAt | DateTime | auto |

Relación:
- un producto tiene muchas imágenes.

---

### Order

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| orderNumber | String | unique, legible |
| status | OrderStatus | requerido |
| paymentStatus | PaymentStatus | requerido |
| customerName | String | requerido |
| customerEmail | String | requerido |
| customerPhone | String | requerido |
| shippingStreet | String | requerido |
| shippingNumber | String | requerido |
| shippingFloor | String? | opcional |
| shippingApartment | String? | opcional |
| shippingCity | String | requerido |
| shippingProvince | String | requerido |
| shippingPostalCode | String | requerido |
| shippingCountry | String | default AR |
| shippingProvider | String? | snapshot |
| shippingService | String? | snapshot |
| shippingTrackingCode | String? | opcional |
| subtotal | Decimal(12,2) | requerido |
| shippingCost | Decimal(12,2) | requerido |
| total | Decimal(12,2) | requerido |
| currency | String | default ARS |
| paidAt | DateTime? | opcional |
| shippedAt | DateTime? | opcional |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Índices sugeridos:
- orderNumber;
- status;
- paymentStatus;
- customerEmail;
- createdAt.

---

### OrderItem

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| orderId | UUID | FK |
| productId | UUID? | FK nullable |
| productName | String | snapshot |
| productSku | String | snapshot |
| unitPrice | Decimal(12,2) | snapshot |
| quantity | Int | > 0 |
| lineTotal | Decimal(12,2) | requerido |
| personalization | Json? | snapshot |
| createdAt | DateTime | auto |

Regla:

```text
lineTotal = unitPrice * quantity
```

Los snapshots permiten conservar el pedido aunque luego cambie el producto.

---

### Payment

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| orderId | UUID | FK |
| provider | PaymentProvider | requerido |
| providerPaymentId | String? | unique cuando exista |
| preferenceId | String? | Mercado Pago |
| status | PaymentStatus | requerido |
| amount | Decimal(12,2) | requerido |
| currency | String | default ARS |
| rawResponse | Json? | auditoría técnica |
| approvedAt | DateTime? | opcional |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Una orden puede tener más de un intento de pago.

---

### PaymentEvent

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| provider | PaymentProvider | requerido |
| providerEventId | String | unique |
| eventType | String | requerido |
| payload | Json | requerido |
| processedAt | DateTime? | opcional |
| createdAt | DateTime | auto |

Objetivo:
- webhook idempotente;
- evitar aplicar el mismo pago dos veces;
- conservar trazabilidad técnica.

---

### StoreSettings

Tabla de una sola configuración lógica.

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | PK |
| storeName | String | requerido |
| whatsapp | String? | opcional |
| instagramUrl | String? | opcional |
| facebookUrl | String? | opcional |
| contactEmail | String? | opcional |
| shippingOriginPostalCode | String? | opcional |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

## 3. Enums

```ts
enum AdminRole {
  ADMIN
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PREPARING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  REFUNDED
}

enum PaymentProvider {
  MERCADO_PAGO
}
```

---

## 4. Relaciones

```text
Category 1 ───── N Product
Product  1 ───── N ProductImage

Order    1 ───── N OrderItem
Product  1 ───── N OrderItem

Order    1 ───── N Payment
```

`OrderItem.productId` puede ser nullable para preservar historial si en el futuro existe borrado definitivo, aunque el comportamiento preferido es desactivar productos.

---

## 5. Datos que NO se modelan aún

No crear todavía:

- Customer/User
- Cart
- CartItem
- Wishlist
- Coupon
- Review
- InventoryReservation
- InventoryMovement
- Newsletter
- RefreshToken
- AddressBook

Solo se agregan cuando exista un requerimiento real.
