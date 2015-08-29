class CreatePlayerTypes < ActiveRecord::Migration
  def change
    create_table :player_types do |t|

      t.string    :type
      t.integer		:player_id 

      t.timestamps null: false
    end
    add_foreign_key :player_types, :players
  end
end
