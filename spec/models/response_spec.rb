require 'rails_helper'

RSpec.describe Response, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:response)).to be_valid
  end

  it "is invalid without reply content" do
    expect(FactoryGirl.build(:response, reply: nil)).to_not be_valid
  end

  it "is invalid without 2 or more characters in reply content" do
    expect(FactoryGirl.build(:response, reply: "y")).to_not be_valid
  end

  it "is invalid without a user id" do
    expect(FactoryGirl.build(:response, user_id: nil)).to_not be_valid
  end

  it "is invalid without a post id" do
    expect(FactoryGirl.build(:response, post_id: nil)).to_not be_valid
  end

end
