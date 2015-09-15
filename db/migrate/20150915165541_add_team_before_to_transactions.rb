class AddTeamBeforeToTransactions < ActiveRecord::Migration
  def change
  	add_column :transactions, :team_before, :string
  end
end
