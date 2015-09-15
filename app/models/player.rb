class Player < ActiveRecord::Base
  belongs_to :user
  belongs_to :level
  belongs_to :position
  has_many :transactions

  validates :last_name,       presence: true
  validates :first_name,      presence: true
  validates :position_id,     presence: true

end
