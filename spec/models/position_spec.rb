require 'rails_helper'

RSpec.describe Position, type: :model do
  it "has a valid factory" do
    expect(FactoryGirl.create(:position)).to be_valid
  end

  it "is invalid without defined spot" do
    expect(FactoryGirl.build(:position, spot: nil)).to_not be_valid
  end

end
