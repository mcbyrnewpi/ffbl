class CreateBooks < ActiveRecord::Migration
  def change
    create_table :books do |t|

    	t.string			:selector
    	t.string			:title
    	t.string			:author
    	t.text				:summary
    	t.date        :start
      t.date        :end

      t.timestamps null: false
    end
  end
end
