bclass AddMinorsToUsers < ActiveRecord::Migration
  def change
    add_column :users, :a, :string
    add_column :users, :aa, :string
    add_column :users, :aaa, :string
    add_column :users, :about, :text
  end
end
