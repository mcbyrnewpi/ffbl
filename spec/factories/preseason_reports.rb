FactoryGirl.define do
  factory :preseason_report do
    report_title { Faker::Lorem.characters(10) }
    report_content { Faker::Lorem.characters(10) }
    user_id { 1 }
  end

end
