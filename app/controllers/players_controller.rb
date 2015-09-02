class PlayersController < ApplicationController
before_action :admin_user, only: [:new, :create, :edit, :update]


	def index
		@players = Player.all.order(:last_name)
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
			flash[:success] = "Player Successfully Created!"
			redirect_to new_player_path
		else
			flash.now[:danger] = "Could not create player"
			redirect_to new_player_path
		end
	end

	def edit
    @player = Player.find(params[:id])
  end

	def update
    @player = Player.find(params[:id])
    if @player.update_attributes(player_params)
      flash[:success] = "Player successfully updated"
      redirect_to @player
    else
      render 'edit'
    end
  end

	private

		def player_params
      params.require(:player).permit(:first_name, :last_name, :dob, :retro, :activate, :user_id, :position_id, :level_id, :player_type_id)
    end

		def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end
end
