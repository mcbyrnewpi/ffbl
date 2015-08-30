class Position < ActiveRecord::Base
  has_many :players

  validates :spot,      presence: true, uniqueness: true
end
