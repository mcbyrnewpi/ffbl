class Post < ActiveRecord::Base
  belongs_to :user

  validates :topic, 	presence: true, length: { in: 5..75 }
  validates :content, presence: true, length: { minimum: 5 }
  validates :user_id, presence: true
end
