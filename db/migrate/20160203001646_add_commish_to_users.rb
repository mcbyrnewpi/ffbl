class AddCommishToUsers < ActiveRecord::Migration
  def change
    add_column :users, :commish, :boolean, default: false
  end
end
