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
    @transactions = @user.transactions.paginate(:page => params[:page], :per_page => 10).where("(league_before LIKE 'MLB' AND league_after LIKE 'A%') 
                        OR (league_before LIKE 'A%' AND league_after LIKE 'MLB') 
                        OR (team_before is null AND team_after is not null) 
                        OR (team_before is not null AND team_after is null) 
                        OR (team_before is not null AND team_after is not null AND team_before <> team_after) 
                        OR (league_before LIKE 'Dr%' AND league_after NOT LIKE 'Dr%') 
                        OR (league_before LIKE 'MLB' AND league_after LIKE 'NA')
                        OR (league_before LIKE 'NA' AND league_after NOT LIKE 'NA')
                        OR (league_before LIKE '%DL' AND league_after NOT LIKE '%DL')
                        OR (league_before LIKE 'MLB' AND league_after LIKE '%DL')").order("id DESC")
    @trades = @user.transactions.trades.paginate(:page => params[:page], :per_page => 10).order("id DESC")
    @preseason_report = @user.preseason_reports.last
    @year1 = @players.where("last_name LIKE ?", "%2018")
    @year2 = @players.where("last_name LIKE ?", "%2019")
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
