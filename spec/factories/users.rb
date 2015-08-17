FactoryGirl.define do
  factory :user do
    name { Faker::Name.first_name + " " + Faker::Name.last_name }
    email { Faker::Internet.email }
    team { Faker::Lorem.characters(10) }
    password { "password" }
    password_confirmation { "password" }
  end

end
