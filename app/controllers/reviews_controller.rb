class ReviewsController < ApplicationController
	before_action :glctac_user, only: [:create]

	def create
		@review = Review.new(review_params)
		if @review.save
      respond_to do |format|
        format.js
        format.html { redirect_to @review.book }
      end
		else
			flash[:danger] = "Could not post review, please try again."
			redirect_to @review.book
		end
	end

	private

		def review_params
      params.require(:review).permit(:thoughts, :user_id, :book_id)
    end

		def glctac_user
      redirect_to(root_url) unless logged_in? && current_user.glctac == true
    end
end
