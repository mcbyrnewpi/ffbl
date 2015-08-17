class CreateLevels < ActiveRecord::Migration
  def change
    create_table :levels do |t|

      t.string    :league
      t.integer   :player_id

      t.timestamps null: false
    end
  end
end
