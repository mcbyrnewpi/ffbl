class StaticPagesController < ApplicationController
before_action :commish, only: [:commissioner]

  
  def home
    @transactions = Transaction.all.order("id DESC")
    @posts = Post.all.order("most_recent DESC")
    @commish_note = CommishNote.last
    @post = Post.new
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

  def commissioner

  end

  private

    def commish
      redirect_to(root_url) unless logged_in? && current_user.commish?
    end
  

end

