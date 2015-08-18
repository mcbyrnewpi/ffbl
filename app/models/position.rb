class Position < ActiveRecord::Base
  has_many :players

  validates :spot,      presence: true
  validates :player_id, presence: true
end
