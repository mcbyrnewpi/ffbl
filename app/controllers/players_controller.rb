class PlayersController < ApplicationController
before_action :logged_in_user, only: [:edit, :update]
before_action :admin_user, only: [:new, :create]

	def index
		if params[:search]
			@players = Player.where("last_name ILIKE ?", "%#{(params[:search]).strip}%").order(:last_name)
		else
			@players = Player.all.order(:last_name)
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
    	else
    		@team_after = nil
    	end

    	if @player.level
    		@league_after = @player.level.league
    	else
    		@league_after = nil
    	end
    	
    	@transaction = Transaction.create(:player_id => @player.id, :user_id => current_user.id, :team_before => @team_before, :team_after => @team_after, :league_before => @league_before, :league_after => @league_after)
      
      flash[:success] = "#{@player.first_name} #{@player.last_name} has been changed forever, due to your actions..."
      redirect_to current_user
    else
      render 'edit'
    end
  end

  def display_mlb
  	@players = Player.all.order(:last_name)
  end

  def display_milb
  	@players = Player.all.order(:last_name)
  end

  def display_sixtyday
  	@players = Player.all.order(:last_name)
  end

  def display_unowned
  	@players = Player.all.order(:last_name)
  end

  def drop_player
  	@player = Player.find(params[:id])
  end

  def add_player
  	@player = Player.find(params[:id])
  end


	private

		def player_params
      params.require(:player).permit(:first_name, :last_name, :dob, :retro, :activate, :user_id, :position_id, :level_id)
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
