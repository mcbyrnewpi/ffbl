class AddGlctacToUsers < ActiveRecord::Migration
  def change
  	add_column :users, :glctac, :boolean, default: false
  end
end
