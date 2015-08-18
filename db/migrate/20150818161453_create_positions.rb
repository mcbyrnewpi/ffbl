class CreatePositions < ActiveRecord::Migration
  def change
    create_table :positions do |t|
      t.references :player, index: true, foreign_key: true

      t.string :spot

      t.timestamps null: false
    end
  end
end
