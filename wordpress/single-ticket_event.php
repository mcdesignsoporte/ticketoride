<?php
/**
 * Template sugerido para detalle individual.
 * single-ticket_event.php
 */
get_header();
$slug = get_post_field('post_name', get_the_ID());
?>
<main style="padding:40px 0">
  <div class="container">
    <h1><?php the_title(); ?></h1>
    <p>Slug actual: <?php echo esc_html($slug); ?></p>
    <p>Montaje sugerido del frontend:</p>
    <a href="<?php echo esc_url(get_stylesheet_directory_uri() . '/ticketoride/evento.html?slug=' . $slug); ?>">Abrir vista frontend</a>
  </div>
</main>
<?php get_footer(); ?>
