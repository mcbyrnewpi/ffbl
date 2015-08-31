class PlayerTypesController < ApplicationController
	before_action :admin_user, only: [:index, :new, :create, :destroy]

	def index
		@player_types = PlayerType.all
	end

	def new
		@player_type = PlayerType.new
	end


	def create
		@player_type = PlayerType.new(player_type_params)
		if @player_type.save
			flash.now[:success] = "New Player Type Created"
			redirect_to player_types_path
		else
			flash[:danger] = "Could not create player type"
			render 'new'
		end
	end

	def destroy
		PlayerType.find(params[:id]).destroy
		flash[:success] = "Player type deleted"
		redirect_to player_types_path
	end

	private

		def player_type_params
      params.require(:player_type).permit(:kind)
    end

		def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end
end
