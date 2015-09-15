class CreateTransactions < ActiveRecord::Migration
  def change
    create_table :transactions do |t|
      t.string :team_after
      t.string :league_after
      t.references :user, index: true, foreign_key: true
      t.references :player, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
