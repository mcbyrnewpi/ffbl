FactoryGirl.define do
  factory :commish_note do
    commish_note_content { Faker::Lorem.paragraph(2) }
  end

end
