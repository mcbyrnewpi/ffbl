class CommishNote < ActiveRecord::Base
  belongs_to :user

  validates :commish_note_content, presence: true

end
