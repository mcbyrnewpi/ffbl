class TransactionsController < ApplicationController

	def index
		@transactions = Transaction.all.order("id DESC")
	end

end
