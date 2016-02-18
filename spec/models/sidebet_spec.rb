require 'rails_helper'

RSpec.describe Sidebet, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:sidebet)).to be_valid
  end

  it "is invalid with no over" do
    expect(FactoryGirl.build(:sidebet, over: nil)).to_not be_valid
  end

  it "is invalid with no under" do
    expect(FactoryGirl.build(:sidebet, under: nil)).to_not be_valid
  end

  it "is invalid with no bet info" do
    expect(FactoryGirl.build(:sidebet, bet_info: nil)).to_not be_valid
  end

  it "is invalid with no over" do
    expect(FactoryGirl.build(:sidebet, stakes: nil)).to_not be_valid
  end

end
