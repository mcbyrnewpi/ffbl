FactoryGirl.define do
  factory :response do
    reply "MyText"
    user_id { 1 }
    post_id { 1 }
  end

end
