class AddPlayerInfoToTransactions < ActiveRecord::Migration
  def change
  	add_column :transactions, :player_first_name, :string
  	add_column :transactions, :player_last_name, :string
  end
end
