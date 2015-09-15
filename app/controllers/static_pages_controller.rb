class StaticPagesController < ApplicationController
  
  def home
    @transactions = Transaction.all.order("id DESC")
  end

  def about
  end

  def rules
  end

  def documents
  end

  def champions
  end

  def player_records
  end

  def team_records
  end
  
end

