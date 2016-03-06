class PlayersController < ApplicationController
before_action :logged_in_user, only: [:edit, :update]
before_action :admin_user, only: [:new, :create]

	def index
		if params[:search]
			@players = Player.where("last_name ILIKE ? OR first_name ILIKE ?", "%#{(params[:search]).strip}%", "%#{(params[:search]).strip}%").order(:last_name)
		else
			@players = Player.where(position_id: 1..8)
		end
	end

	def show
		@player = Player.find(params[:id])
	end

	def new
		@player = Player.new
	end

	def create
		@player = Player.new(player_params)
		if @player.save
			flash[:success] = "#{@player.first_name} #{@player.last_name} Successfully Created!"
			redirect_to new_player_path
		else
			flash[:danger] = "Could not create player"
			redirect_to new_player_path
		end
	end

	def edit
    @player = Player.find(params[:id])
  end

	def update
    @player = Player.find(params[:id])
    
    if @player.user
    	@team_before = @player.user.team
      @user_page = @player.user
      @user_id1 = @player.user.id
    else
    	@team_before = nil
    end

    if @player.level
    	@league_before = @player.level.league
    else
    	@league_before = nil
    end


    if @player.update_attributes(player_params)

    	if @player.user
    		@team_after = @player.user.team
        @user_page = @player.user
        @user_id2 = @player.user.id
    	else
    		@team_after = nil
    	end

    	if @player.level
    		@league_after = @player.level.league
    	else
    		@league_after = nil
    	end

      if @player.retro
        @player.update_attributes(activate: @player.retro + 60)
      end

      if @user_id1
        @user_id = @user_id1
      elsif @user_id2
        @user_id = @user_id2
      end
        
    	
    	@transaction = Transaction.create(:player_id => @player.id, :user_id => @user_id, :team_before => @team_before, :team_after => @team_after, :league_before => @league_before, :league_after => @league_after, :player_last_name => @player.last_name, :player_first_name => @player.first_name, :details => @player.trade_info)
      
      flash[:success] = "#{@player.first_name} #{@player.last_name} has been changed forever, due to your actions..."
      
      if current_user.admin? && (@player.user != current_user)
        redirect_to user_path(@user_page)
      else
        redirect_to current_user
      end
    else
      render 'edit'
    end
  end

  def display_mlb
  	@players = Player.where("level_id = 1 OR level_id = 2 OR level_id = 7")
  end

  def display_milb
    @players = Player.where(level_id: 3..5)
  end

  def display_sixtyday
  	@players = Player.where(level_id: 2)
  end

  def display_unowned
  	@players = Player.where(user_id: nil)
  end

  def drop_player
  	@player = Player.find(params[:id])
  end

  def add_player
  	@player = Player.find(params[:id])
  end

  def catcher_sort
    @players = Player.where(position_id: 1)
  end

  def all_first
    @players = Player.where(position_id: 2)
  end

  def all_second
    @players = Player.where(position_id: 3)
  end

  def all_third
    @players = Player.where(position_id: 4)
  end

  def all_short
    @players = Player.where(position_id: 5)
  end

  def all_of
    @players = Player.where(position_id: 6)
  end

  def all_sp
    @players = Player.where(position_id: 7)
  end

  def all_rp
    @players = Player.where(position_id: 8)
  end


	private

		def player_params
      params.require(:player).permit(:first_name, :last_name, :dob, :retro, :activate, :user_id, :position_id, :level_id, :trade_info, :affiliation, :player_note)
    end

		def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end

    def logged_in_user
      unless logged_in?
        store_location
        flash[:danger] = "Please log in."
        redirect_to login_url
      end
    end
end
