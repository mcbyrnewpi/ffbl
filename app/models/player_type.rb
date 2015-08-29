class PlayerType < ActiveRecord::Base
  has_many :players
  
  validates :type, presence: true
end
