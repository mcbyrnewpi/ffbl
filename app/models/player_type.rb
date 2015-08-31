class PlayerType < ActiveRecord::Base
  has_many :players
  
  validates :kind, presence: true
end
