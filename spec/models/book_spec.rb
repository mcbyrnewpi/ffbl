require 'rails_helper'

RSpec.describe Book, type: :model do
  

  it "has a valid factory" do
    expect(FactoryGirl.build(:book, :end => DateTime.now)).to be_valid
  end

  it "is invalid without a selector" do
    expect(FactoryGirl.build(:book, :end => DateTime.now, selector: nil)).to_not be_valid
  end

  it "is invalid without a title" do
    expect(FactoryGirl.build(:book, :end => DateTime.now, title: nil)).to_not be_valid
  end

  it "is invalid without a author" do
    expect(FactoryGirl.build(:book, :end => DateTime.now, author: nil)).to_not be_valid
  end

  it "is invalid without a summary" do
    expect(FactoryGirl.build(:book, :end => DateTime.now, summary: nil)).to_not be_valid
  end

  it "is invalid without a start date" do
    expect(FactoryGirl.build(:book, :end => DateTime.now, start: nil)).to_not be_valid
  end

  it "is invalid without an end date" do
    expect(FactoryGirl.build(:book)).to_not be_valid
  end


end

