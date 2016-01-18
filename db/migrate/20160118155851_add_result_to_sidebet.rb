class AddResultToSidebet < ActiveRecord::Migration
  def change
    add_column :sidebets, :winner, :string
  end
end
