class PreseasonReport < ActiveRecord::Base
  belongs_to :user

  validates :user_id,         presence: true
  validates :report_title,    presence: true
  validates :report_content,  presence: true

end
