require 'rails_helper'

RSpec.describe CommishNote, type: :model do
  it "has a valid factory" do
    expect(FactoryGirl.create(:commish_note)).to be_valid
  end

  it "is invalid with no commish note content" do
    expect(FactoryGirl.build(:commish_note, commish_note_content: nil)).to_not be_valid
  end

end
