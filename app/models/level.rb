class Level < ActiveRecord::Base
  has_many :players
  belongs_to :user

  validates :league,    presence: true
end
