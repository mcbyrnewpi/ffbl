class AddAffiliateToPlayers < ActiveRecord::Migration
  def change
  	add_column :players, :affiliation, :string
  	add_column :players, :player_note, :text
  end
end
