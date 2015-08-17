class Player < ActiveRecord::Base
  belongs_to :user
  belongs_to :level
  belongs_to :player_type
end
