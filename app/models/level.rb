class Level < ActiveRecord::Base
  has_many :players

  validates :league,    presence: true
  validates :player_id, presence: true
end
