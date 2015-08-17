class CreatePlayers < ActiveRecord::Migration
  def change
    create_table :players do |t|
      t.references  :user,        index: true, foreign_key: true
      t.references  :level,       index: true, foreign_key: true
      t.references  :player_type, index: true, foreign_key: true

      t.string      :last_name
      t.string      :first_name
      t.string      :position
      t.date        :dob 
      t.date        :retro
      t.date        :activate

      t.timestamps null: false
    end
  end
end
