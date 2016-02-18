require 'rails_helper'

RSpec.describe Transaction, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:transaction)).to be_valid
  end

  it "is invalid with no user id" do
    expect(FactoryGirl.build(:transaction, user_id: nil)).to_not be_valid
  end

  it "is invalid with no player id" do
    expect(FactoryGirl.build(:transaction, player_id: nil)).to_not be_valid
  end

  it "is valid with no team before" do
    expect(FactoryGirl.build(:transaction, team_before: nil)).to be_valid
  end

  it "is valid with no team after" do
    expect(FactoryGirl.build(:transaction, team_after: nil)).to be_valid
  end

  it "is valid with no league before" do
    expect(FactoryGirl.build(:transaction, league_before: nil)).to be_valid
  end

  it "is valid with no league after" do
    expect(FactoryGirl.build(:transaction, league_after: nil)).to be_valid
  end

  it "is valid with no team before" do
    expect(FactoryGirl.build(:transaction, team_before: nil)).to be_valid
  end

  it "is invalid with no player first name" do
    expect(FactoryGirl.build(:transaction, player_first_name: nil)).to_not be_valid
  end

  it "is invalid with no player last name" do
    expect(FactoryGirl.build(:transaction, player_last_name: nil)).to_not be_valid
  end

  it "is valid with no details" do
    expect(FactoryGirl.build(:transaction, details: nil)).to be_valid
  end

end
