class AddMostRecentToPosts < ActiveRecord::Migration
  def change
  	add_column :posts, :most_recent, :datetime
  end
end
