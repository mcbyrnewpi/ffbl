class AddIndexToUsersTeam < ActiveRecord::Migration
  def change
    add_index :users, :team
  end
end
