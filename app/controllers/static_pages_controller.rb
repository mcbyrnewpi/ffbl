class StaticPagesController < ApplicationController
  
  def home
    @transactions = Transaction.all.order("id DESC")
    @posts = Post.all.order("most_recent DESC")
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

  def team_violations
    @users = User.all.order(:team)
  end
  
end

