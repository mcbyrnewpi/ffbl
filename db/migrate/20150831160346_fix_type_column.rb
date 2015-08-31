class FixTypeColumn < ActiveRecord::Migration
  def change
  	rename_column :player_types, :type, :kind
  end
end
