require 'rails_helper'

RSpec.describe User, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:user)).to be_valid
  end

  it "is invalid without name" do
    expect(FactoryGirl.build(:user, name: nil)).to_not be_valid
  end

  it "is invalid without email address" do
    expect(FactoryGirl.build(:user, email: nil)).to_not be_valid
  end

  it "is valid with properly formatted email address" do
    expect(FactoryGirl.build(:user, email: "hello@example.com")).to be_valid
  end

  it "is invalid with incorrect email format" do
    expect(FactoryGirl.build(:user, email: "hello.example")).to_not be_valid
  end

  it "is invalid if email address is duplicate" do
    user1 = FactoryGirl.create(:user)
    user2 = FactoryGirl.build(:user, email: user1.email)
    expect(user2).to_not be_valid
  end

  it "is invalid without a team name" do
    expect(FactoryGirl.build(:user, team: "")).to_not be_valid
  end

  it "is invalid without a password" do
    expect(FactoryGirl.build(:user, password: nil, password_confirmation: nil)).to_not be_valid
  end

  it "is invalid if password is less than 6 characters" do
    expect(FactoryGirl.build(:user, password: "hello", password_confirmation: "hello")).to_not be_valid
  end

  it "is invalid if password_confirmation doesn't match password" do
    expect(FactoryGirl.build(:user, password_confirmation: "passwor")).to_not be_valid
  end

end
