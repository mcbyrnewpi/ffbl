FactoryGirl.define do
  factory :user do
    name { Faker::Name.first_name + " " + Faker::Name.last_name }
    email { Faker::Internet.email }
    team { Faker::Lorem.characters(10) }
    password { "password" }
    password_confirmation { "password" }
  end

  factory :invalid_user, parent: :user do
    name { Faker::Name.first_name + " " + Faker::Name.last_name }
    email { Faker::Internet.email }
    team { Faker::Lorem.characters(10) }
    password { "pass" }
    password_confirmation { "pass" }
  end

  factory :admin_user, parent: :user do
    name { Faker::Name.first_name + " " + Faker::Name.last_name }
    email { Faker::Internet.email }
    team { Faker::Lorem.characters(10) }
    password { "password" }
    password_confirmation { "password" }
    admin { true }
  end

  factory :glctac_user, parent: :user do
    name { Faker::Name.first_name + " " + Faker::Name.last_name }
    email { Faker::Internet.email }
    team { Faker::Lorem.characters(10) }
    password { "password" }
    password_confirmation { "password" }
    glctac { true }
  end

  factory :glctac_admin_user, parent: :user do
    name { Faker::Name.first_name + " " + Faker::Name.last_name }
    email { Faker::Internet.email }
    team { Faker::Lorem.characters(10) }
    password { "password" }
    password_confirmation { "password" }
    glctac { true }
    admin { true }
  end



end
