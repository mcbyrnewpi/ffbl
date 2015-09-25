class AddTradeInfoToPlayers < ActiveRecord::Migration
  def change
    add_column :players, :trade_info, :text
  end
end
