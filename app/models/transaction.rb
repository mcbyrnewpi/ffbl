class Transaction < ActiveRecord::Base
  belongs_to :user
  belongs_to :player

  validates :user_id,           presence: true
  validates :player_id,         presence: true
  validates :player_last_name,  presence: true
  validates :player_first_name, presence: true

  scope :adds, -> { where("team_before is null AND team_after is not null") }
  scope :drops, -> { where("team_before is not null AND team_after is null") }
  scope :trades, -> { where("team_before is not null AND team_after is not null AND team_before <> team_after") }
  scope :adt, -> { where("(league_before LIKE 'MLB' AND league_after LIKE 'A%') OR (league_before LIKE 'A%' AND league_after LIKE 'MLB') OR (team_before is null AND team_after is not null) OR (team_before is not null AND team_after is null) OR (team_before is not null AND team_after is not null AND team_before <> team_after) ") }
end
