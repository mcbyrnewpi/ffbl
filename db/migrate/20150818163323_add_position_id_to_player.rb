class AddPositionIdToPlayer < ActiveRecord::Migration
  def change
    change_table :players do |t|
      t.remove :position 
      
      t.integer :position_id
    end
  end
end
