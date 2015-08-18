FactoryGirl.define do
  factory :player do
    user_id { 1 }
    level_id { 1 }
    player_type_id { 1 }
    last_name { Faker::Name.last_name }
    first_name { Faker::Name.first_name }
    position_id { 1 }
    dob { Faker::Date.backward(165) }
    retro { Faker::Date.backward(14) }
    activate { Faker::Date.forward(60) }
  end

end
