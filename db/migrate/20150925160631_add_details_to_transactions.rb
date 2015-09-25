class AddDetailsToTransactions < ActiveRecord::Migration
  def change
    add_column :transactions, :details, :text
  end
end
