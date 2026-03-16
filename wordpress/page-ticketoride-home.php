<?php
/**
 * Template Name: Ticketoride Home
 */
get_header();
?>
<main style="padding:40px 0">
  <div class="container">
    <h1>Ticketoride Home</h1>
    <p>Puedes usar este template para incrustar o redirigir al frontend premium.</p>
    <ul>
      <li><a href="<?php echo esc_url(get_stylesheet_directory_uri() . '/ticketoride/index.html'); ?>">Landing</a></li>
      <li><a href="<?php echo esc_url(get_stylesheet_directory_uri() . '/ticketoride/eventos.html'); ?>">Eventos</a></li>
      <li><a href="<?php echo esc_url(get_stylesheet_directory_uri() . '/ticketoride/scanner.html'); ?>">Scanner</a></li>
    </ul>
  </div>
</main>
<?php get_footer(); ?>
