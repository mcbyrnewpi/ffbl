class ResponsesController < ApplicationController
	before_action :logged_in_user, only: [:create]

	def create
		@response = Response.new(response_params)
		if @response.save
			flash[:success] = "You have responded to this thread!"
			redirect_to @response.post
		else
			flash[:danger] = "Response could not be created, please try again."
			redirect_to @response.post
		end
	end

	private

		def response_params
      params.require(:response).permit(:reply, :user_id, :post_id)
    end

		def logged_in_user
      unless logged_in?
        store_location
        flash[:danger] = "Please log in."
        redirect_to login_url
      end
    end

end
