<?php
/**
 * Snippet de ejemplo para integrar Ticketoride con WordPress.
 * Colócalo en un plugin propio o en functions.php de un child theme.
 */

/**
 * 1) Registrar Custom Post Type para eventos
 */
add_action('init', function () {
    register_post_type('ticket_event', [
        'label' => 'Eventos',
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon' => 'dashicons-tickets-alt',
        'rewrite' => ['slug' => 'eventos'],
    ]);
});

/**
 * 2) Registrar assets del frontend
 */
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'ticketoride-style',
        get_stylesheet_directory_uri() . '/ticketoride/css/style.css',
        [],
        '1.0.0'
    );

    wp_enqueue_script(
        'ticketoride-mock',
        get_stylesheet_directory_uri() . '/ticketoride/js/mock-data.js',
        [],
        '1.0.0',
        true
    );

    wp_enqueue_script(
        'ticketoride-bridge',
        get_stylesheet_directory_uri() . '/ticketoride/js/wp-bridge.js',
        ['ticketoride-mock'],
        '1.0.0',
        true
    );

    wp_enqueue_script(
        'ticketoride-app',
        get_stylesheet_directory_uri() . '/ticketoride/js/app.js',
        ['ticketoride-bridge'],
        '1.0.0',
        true
    );

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
});

/**
 * 3) Endpoint de ejemplo: listado de eventos
 */
add_action('rest_api_init', function () {
    register_rest_route('ticketoride/v1', '/events', [
        'methods'  => 'GET',
        'callback' => function () {
            $query = new WP_Query([
                'post_type'      => 'ticket_event',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
            ]);

            $events = [];

            while ($query->have_posts()) {
                $query->the_post();

                $events[] = [
                    'id'            => get_the_ID(),
                    'slug'          => get_post_field('post_name', get_the_ID()),
                    'title'         => get_the_title(),
                    'city'          => get_post_meta(get_the_ID(), 'city', true),
                    'venue'         => get_post_meta(get_the_ID(), 'venue', true),
                    'dateLabel'     => get_post_meta(get_the_ID(), 'date_label', true),
                    'time'          => get_post_meta(get_the_ID(), 'time', true),
                    'category'      => get_post_meta(get_the_ID(), 'category', true),
                    'startingPrice' => (int) get_post_meta(get_the_ID(), 'starting_price', true),
                    'status'        => get_post_meta(get_the_ID(), 'status', true),
                    'summary'       => get_the_excerpt(),
                    'description'   => apply_filters('the_content', get_the_content()),
                    'coverClass'    => get_post_meta(get_the_ID(), 'cover_class', true) ?: 'cover-live-night',
                    // Idealmente este campo vendría de un repetidor o JSON guardado
                    'zones'         => json_decode(get_post_meta(get_the_ID(), 'zones_json', true), true) ?: [],
                    'faqs'          => json_decode(get_post_meta(get_the_ID(), 'faqs_json', true), true) ?: [],
                ];
            }

            wp_reset_postdata();

            return rest_ensure_response($events);
        },
        'permission_callback' => '__return_true',
    ]);
});

/**
 * 4) Endpoint de ejemplo para checkout custom
 */
add_action('rest_api_init', function () {
    register_rest_route('ticketoride/v1', '/checkout', [
        'methods'  => 'POST',
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params();

            // Aquí puedes:
            // - crear orden WooCommerce
            // - generar código de ticket
            // - guardar meta del evento y zona
            // - disparar email / WhatsApp

            return rest_ensure_response([
                'ok'      => true,
                'message' => 'Checkout recibido',
                'payload' => $payload,
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
});

/**
 * 5) Endpoint de ejemplo para validar acceso
 */
add_action('rest_api_init', function () {
    register_rest_route('ticketoride/v1', '/scan', [
        'methods'  => 'POST',
        'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params();
            $code = sanitize_text_field($payload['code'] ?? '');

            // Aquí validarías ticket real contra order meta o tabla custom.
            return rest_ensure_response([
                'ok'     => true,
                'code'   => $code,
                'status' => 'valid',
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
});
