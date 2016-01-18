class CreateSidebets < ActiveRecord::Migration
  def change
    create_table :sidebets do |t|

      t.string    :over
      t.string    :under
      t.text      :bet_info
      t.string    :stakes

      t.timestamps null: false
    end
  end
end
