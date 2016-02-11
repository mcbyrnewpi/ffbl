$(document).on "page:change", ->
  $('.reviews-link').click (event) ->
    event.stopPropagation()
    event.preventDefault()
    $('.review-section').slideToggle()
    $('#review_thoughts').focus()