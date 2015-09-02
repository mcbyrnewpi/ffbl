class LevelsController < ApplicationController
	before_action :admin_user, only: [:new, :create, :destroy]

	def index
		@levels = Level.all
	end

	def new
		@level = Level.new
	end


	def create
		@level = Level.new(level_params)
		if @level.save
			flash.now[:success] = "New Player Level Created"
			redirect_to levels_path
		else
			flash[:danger] = "Could not create player level"
			render 'new'
		end
	end

	def destroy
		Level.find(params[:id]).destroy
		flash[:success] = "Player Level deleted"
		redirect_to levels_path
	end

	private

		def level_params
      params.require(:level).permit(:league, :user_id)
    end

		def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end
end
