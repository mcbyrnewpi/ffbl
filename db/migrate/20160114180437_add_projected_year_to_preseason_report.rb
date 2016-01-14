class AddProjectedYearToPreseasonReport < ActiveRecord::Migration
  def change
    add_column :preseason_reports, :proj_year, :integer
  end
end
