# Guía de integración con WordPress

## Objetivo
Usar este frontend como capa visual y conectar la información real desde WordPress y WooCommerce.

## Arquitectura sugerida
- **WordPress**: administración del contenido
- **Custom Post Type**: `ticket_event`
- **WooCommerce**: órdenes, pagos, estados y productos
- **REST API**: para eventos, zonas, tickets y validación
- **Frontend actual**: conserva la experiencia visual y consume datos reales

## Opción recomendada
### 1) Eventos
Crea un CPT `ticket_event` con estos campos:
- título
- resumen
- descripción
- ciudad
- venue
- fecha
- hora
- precio_desde
- estado_venta
- zonas (JSON o repetidor)

### 2) Zonas
Puedes manejar las zonas de tres formas:
- como meta del evento
- como variaciones de producto WooCommerce
- como productos individuales asociados al evento

### 3) Checkout
Hay dos caminos:
- **WooCommerce completo**: enviar al checkout real
- **Checkout custom**: usar REST y luego crear orden manualmente

### 4) Tickets
Guardar en meta de orden:
- código de ticket
- QR
- estado de acceso
- zona
- cantidad
- event_id

### 5) Scanner
Crear endpoint:
- `POST /wp-json/ticketoride/v1/scan`
- recibe código QR o ticket
- responde estado válido / usado / inválido

## Localización de scripts
El frontend ya contempla `window.TicketorideConfig`.
Desde PHP puedes inyectar:

```php
wp_localize_script('ticketoride-bridge', 'TicketorideConfig', [
  'mode' => 'wordpress',
  'siteName' => get_bloginfo('name'),
  'nonce' => wp_create_nonce('wp_rest'),
  'endpoints' => [
    'events' => rest_url('ticketoride/v1/events'),
    'event' => rest_url('ticketoride/v1/events/{slug}'),
    'checkout' => rest_url('ticketoride/v1/checkout'),
    'tickets' => rest_url('ticketoride/v1/tickets'),
    'scan' => rest_url('ticketoride/v1/scan'),
  ],
]);
```

## Flujo ideal
1. Frontend muestra eventos
2. Usuario entra al detalle
3. Selecciona zona/asiento
4. Checkout real con WooCommerce o endpoint custom
5. Se genera ticket QR
6. Ticket aparece en cartera
7. Scanner valida acceso

## Recomendación práctica
Primero usa este paquete para vender la propuesta y validar la UX.
Después migra por fases:
1. eventos reales
2. checkout real
3. tickets QR
4. scanner real
5. reportes y panel
