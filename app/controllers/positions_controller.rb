class PositionsController < ApplicationController
	before_action :admin_user, only: [:index, :new, :create, :destroy]

	def index
		@positions = Position.all
	end

	def new
		@position = Position.new
	end


	def create
		@position = Position.new(position_params)
		if @position.save
			flash.now[:success] = "New Position Created"
			redirect_to positions_path
		else
			flash[:danger] = "Could not create position"
			render 'new'
		end
	end

	def destroy
		Position.find(params[:id]).destroy
		flash[:success] = "Position deleted"
		redirect_to positions_path
	end

	private

		def position_params
      params.require(:position).permit(:spot)
    end

		def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end

end
