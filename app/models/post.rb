class Post < ActiveRecord::Base
  belongs_to :user
  has_many :responses, dependent: :destroy

  validates :topic, 	presence: true, length: { in: 5..75 }
  validates :content, presence: true, length: { minimum: 5 }
  validates :user_id, presence: true
end
