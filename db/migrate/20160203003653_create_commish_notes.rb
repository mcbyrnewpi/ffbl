class CreateCommishNotes < ActiveRecord::Migration
  def change
    create_table :commish_notes do |t|

      t.text :commish_note_content

      t.timestamps null: false
    end
  end
end
