require 'rails_helper'

RSpec.describe Post, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:post)).to be_valid
  end

  it "is invalid without topic" do
    expect(FactoryGirl.build(:post, topic: nil)).to_not be_valid
  end

  it "is invalid with topic under 5 characters" do
    expect(FactoryGirl.build(:post, topic: "Hi")).to_not be_valid
  end

  it "is invalid with topic over 75 characters" do
    expect(FactoryGirl.build(:post_long_topic)).to_not be_valid
  end

  it "is invalid without content" do
    expect(FactoryGirl.build(:post, content: nil)).to_not be_valid
  end

  it "is invalid with content under 5 characters" do
    expect(FactoryGirl.build(:post, content: "sure")).to_not be_valid
  end

  it "is invalid with no user id" do
    expect(FactoryGirl.build(:post, user_id: nil)).to_not be_valid
  end

end
