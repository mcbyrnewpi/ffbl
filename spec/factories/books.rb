FactoryGirl.define do
  factory :book do
    selector { Faker::Name.first_name + " " + Faker::Name.last_name }
    title { Faker::Lorem.characters(10) }
    author { Faker::Lorem.characters(10) }
    summary { Faker::Lorem.paragraph(2) }
    start { Faker::Date.backward(165) }
  end

end
