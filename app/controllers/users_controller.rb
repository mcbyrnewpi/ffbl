class UsersController < ApplicationController

  
  def index
    @users = User.all.order(:team)
  end

  def show
    @user = User.find(params[:id])
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      flash[:success] = "Team Successfully Created!"
      redirect_to @user
    else
      render 'new'
    end 
  end

  private

    def user_params
      params.require(:user).permit(:name, :email, :team, :password, :password_confirmation)
    end

end
