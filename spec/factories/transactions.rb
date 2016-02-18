FactoryGirl.define do
  factory :transaction do
    team_before "Geckos"
    team_after "Ninjas"
    league_before "MLB"
    league_after "AAA"
    player_first_name "Anthony"
    player_last_name  "DiComo"
    details nil
    user_id { 1 }
    player_id { 1 }
  end

end
