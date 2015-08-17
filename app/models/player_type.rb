class PlayerType < ActiveRecord::Base
  belongs_to :player
  
  validates :type, presence: true
end
