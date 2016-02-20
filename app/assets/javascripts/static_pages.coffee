$(document).on "page:change", ->
  $('.post-button').click (event) ->
    event.preventDefault()
    $('.post-topic-popup').toggle()
    $('#post_topic').focus()
  $('.popup-close').click (event) ->
    event.preventDefault()
    $('.post-topic-popup').toggle()
  $('.blue-hell-button').click (event) ->
    event.preventDefault()
    $('.blue-hell-content').toggle()