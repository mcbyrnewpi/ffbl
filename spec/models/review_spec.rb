require 'rails_helper'

RSpec.describe Review, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:review)).to be_valid
  end

  it "is invalid with no thoughts" do
    expect(FactoryGirl.build(:review, thoughts: nil)).to_not be_valid
  end

  it "is invalid with no user id" do
    expect(FactoryGirl.build(:review, user_id: nil)).to_not be_valid
  end

  it "is invalid with no book id" do
    expect(FactoryGirl.build(:review, book_id: nil)).to_not be_valid
  end

end
