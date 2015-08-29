class AddPlayerIdToPlayerTypes < ActiveRecord::Migration
  def change
    add_column :player_types, :player_id, :integer
  end
end
