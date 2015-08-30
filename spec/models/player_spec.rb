require 'rails_helper'

RSpec.describe Player, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:player)).to be_valid
  end

  it "is invalid with no player_type_id" do
    expect(FactoryGirl.build(:player, player_type_id: nil)).to_not be_valid
  end

  it "is invalid with no last name" do
    expect(FactoryGirl.build(:player, last_name: nil)).to_not be_valid
  end

  it "is invalid with no first name" do 
    expect(FactoryGirl.build(:player, first_name: nil)).to_not be_valid
  end

  it "is invalid with no position" do
    expect(FactoryGirl.build(:player, position_id: nil)).to_not be_valid
  end

  it "is valid with no date of birth" do
    expect(FactoryGirl.build(:player, dob: nil)).to be_valid
  end

  it "is valid with no retroactive-to date" do
    expect(FactoryGirl.build(:player, retro: nil)).to be_valid
  end

  it "is valid with no activation date" do
    expect(FactoryGirl.build(:player, activate: nil)).to be_valid
  end


end
