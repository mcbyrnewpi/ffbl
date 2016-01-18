class Sidebet < ActiveRecord::Base

  validates :over,          presence: true
  validates :under,         presence: true
  validates :bet_info,      presence: true
  validates :stakes,        presence: true

end
