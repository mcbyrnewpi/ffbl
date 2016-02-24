$(document).on "page:change", ->
  $('#player_level_id_1').click (event) ->
    event.stopPropagation()
    $('.sixtyday').hide()
    $('.dob').hide()
  $('#player_level_id_2').click (event) ->
    event.stopPropagation()
    $('.sixtyday').show()
    $('.dob').hide()
  $('#player_level_id_3').click (event) ->
    event.stopPropagation()
    $('.sixtyday').hide()
    $('.dob').show()
  $('#player_level_id_4').click (event) ->
    event.stopPropagation()
    $('.sixtyday').hide()
    $('.dob').show()
  $('#player_level_id_5').click (event) ->
    event.stopPropagation()
    $('.sixtyday').hide()
    $('.dob').show()
  $('#player_level_id_6').click (event) ->
    event.stopPropagation()
    $('.sixtyday').hide()
    $('.dob').hide()
  $('#player_level_id_7').click (event) ->
    event.stopPropagation()
    $('.sixtyday').hide()
    $('.dob').hide()

  
