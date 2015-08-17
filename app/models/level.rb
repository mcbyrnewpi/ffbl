class Level < ActiveRecord::Base
  validates :league,    presence: true
  validates :player_id, presence: true
end
