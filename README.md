# Ticketoride Complete Frontend · WordPress Ready

Este paquete es un **frontend completo de boletera** para presentar propuesta comercial y usar como base técnica antes de integrarlo a WordPress.

## Incluye
- Landing premium (`index.html`)
- Catálogo de eventos (`eventos.html`)
- Detalle de evento con zonas y mapa (`evento.html`)
- Checkout demo (`checkout.html`)
- Cartera de boletos (`mis-boletos.html`)
- Scanner / check-in (`scanner.html`)
- Panel operativo (`panel.html`)
- Puente JS para WordPress (`js/wp-bridge.js`)
- Ejemplos PHP para WordPress (`wordpress/`)

## Qué está listo
- UI/UX completa
- Flujo demo de compra
- Órdenes mock en `localStorage`
- QR visual demo
- Estructura pensada para reemplazar mock por datos reales de WordPress/WooCommerce

## Qué falta para producción
- Pagos reales
- Tickets QR reales
- Validación real de acceso
- Control de inventario / bloqueo temporal de asientos
- Seguridad y autenticación
- Emails/WhatsApp transaccionales

## Publicación en GitHub Pages
1. Descomprime el paquete.
2. Sube el contenido al repositorio.
3. Activa GitHub Pages desde `main` + `/(root)`.

## Conexión con WordPress
Revisa la carpeta `wordpress/`:
- `integration-guide.md`
- `functions-ticketoride-bridge.php`
- `archive-ticket_event.php`
- `single-ticket_event.php`
- `page-ticketoride-home.php`

## Recomendación técnica
Para una integración limpia:
1. WordPress como CMS
2. WooCommerce para órdenes y checkout real
3. Custom Post Type `ticket_event`
4. REST API para alimentar el frontend
5. Plugin o endpoint para validación de QR
