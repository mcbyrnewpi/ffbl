FactoryGirl.define do
  factory :post do
    topic { Faker::Lorem.characters(10) }
    content { Faker::Lorem.paragraph(1) }
    user_id { 1 }
  end

  factory :post_long_topic, parent: :post do
    topic { Faker::Lorem.characters(76) }
    content { Faker::Lorem.paragraph(1) }
    user_id { 1 }
  end

end
