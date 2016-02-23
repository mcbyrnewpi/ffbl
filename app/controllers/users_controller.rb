class UsersController < ApplicationController
  before_action :logged_in_user, only: [:edit, :update]
  before_action :correct_user,   only: [:edit, :update]
  before_action :admin_user,     only: [:new, :create]
  
  def index
    @users = User.all.order(:team)
  end

  def show
    @user = User.find(params[:id])
    @players = @user.players.all.order(:position_id)
    @transactions = Transaction.where("team_before = ? OR team_after = ?", @user.team, @user.team).order("id DESC")
    @preseason_report = @user.preseason_reports.last
    @year1 = @players.where("last_name LIKE ?", "%2017")
    @year2 = @players.where("last_name LIKE ?", "%2018")
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      flash[:success] = "#{@user.team} Successfully Created!"
      redirect_to @user
    else
      render 'new'
    end 
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if @user.update_attributes(user_params)
      flash[:success] = "#{@user.team} information updated!"
      redirect_to @user
    else
      render 'edit'
    end
  end

  private

    def user_params
      params.require(:user).permit(:name, :email, :team, :password, :password_confirmation, :a, :aa, :aaa, :about, :glctac, :varnum, :commish)
    end

    def logged_in_user
      unless logged_in?
        store_location
        flash[:danger] = "Please log in."
        redirect_to login_url
      end
    end

    def correct_user
      @user = User.find(params[:id])
      redirect_to(root_url) unless current_user?(@user) || current_user.admin?
    end

    def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end

end
