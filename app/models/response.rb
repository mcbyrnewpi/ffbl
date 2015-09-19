class Response < ActiveRecord::Base
  belongs_to :user
  belongs_to :post

  validates :reply, presence: true, length: { minimum: 2 }
end
