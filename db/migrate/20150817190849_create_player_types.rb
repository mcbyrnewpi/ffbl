class CreatePlayerTypes < ActiveRecord::Migration
  def change
    create_table :player_types do |t|
      t.references  :players, index: true, foreign_key: true

      t.string    :type 

      t.timestamps null: false
    end
  end
end
