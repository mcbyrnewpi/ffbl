$(document).on "page:change", ->
  $('html, body').animate({
    scrollTop: $('a.previous_page').offset().top - 150
  }, 'slow');
