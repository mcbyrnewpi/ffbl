require 'rails_helper'

RSpec.describe PreseasonReport, type: :model do
  
  it "has a valid factory" do
    expect(FactoryGirl.create(:preseason_report)).to be_valid
  end

  it "is invalid without report title" do
    expect(FactoryGirl.build(:preseason_report, report_title: nil)).to_not be_valid
  end

  it "is invalid without report content" do
    expect(FactoryGirl.build(:preseason_report, report_content: nil)).to_not be_valid
  end

  it "is invalid without user id" do
    expect(FactoryGirl.build(:preseason_report, user_id: nil)).to_not be_valid
  end

end
