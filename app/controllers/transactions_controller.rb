class TransactionsController < ApplicationController

	def index
		@transactions = Transaction.paginate(:page => params[:page], :per_page => 10).order("id DESC")
	end

end
