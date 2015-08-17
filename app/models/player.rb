class Player < ActiveRecord::Base
  belongs_to :user
  belongs_to :level
  has_many   :player_type

  validates :user_id,         presence: true
  validates :level_id,        presence: true
  validates :player_type_id,  presence: true
  validates :last_name,       presence: true
  validates :first_name,      presence: true
  validates :position,        presence: true
end
