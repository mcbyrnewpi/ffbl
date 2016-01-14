class AddVarnumToUser < ActiveRecord::Migration
  def change
    add_column :users, :varnum, :boolean, default: false
  end
end
