require 'rails_helper'

RSpec.describe Level, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:level)).to be_valid
  end

  it "is invalid without any league" do
    expect(FactoryGirl.build(:level, league: nil)).to_not be_valid
  end

  it "is invalid without a player_id" do
    expect(FactoryGirl.build(:level, player_id: nil)).to_not be_valid
  end

end
