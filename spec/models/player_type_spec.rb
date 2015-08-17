require 'rails_helper'

RSpec.describe PlayerType, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:player_type)).to be_valid
  end

  it "is invalid with no type" do
    expect(FactoryGirl.build(:player_type, type: nil)).to_not be_valid
  end


end
