FactoryGirl.define do
  factory :review do
    thoughts { Faker::Lorem.paragraph }
    user_id { 1 }
    book_id { 1 }
  end

end
