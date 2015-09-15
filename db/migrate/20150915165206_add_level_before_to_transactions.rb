class AddLevelBeforeToTransactions < ActiveRecord::Migration
  def change
  	add_column :transactions, :league_before, :string
  end
end
