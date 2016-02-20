$(document).on "page:change", ->
  $('.reviews-link').click (event) ->
    event.stopPropagation()
    event.preventDefault()
    $('.review-section').toggle()
    $('#review_thoughts').focus()