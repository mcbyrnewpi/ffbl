FactoryGirl.define do
  factory :sidebet do
    over  { "Geckos" }
    under { "Ninjas" }
    bet_info { "Some dumb Natecat idea probably" }
    stakes { "$20" }
  end

end
