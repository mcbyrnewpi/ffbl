class TransactionsController < ApplicationController

	def index
		if params[:search]
			@transactions = Transaction.paginate(:page => params[:page], :per_page => 25).where("team_before ILIKE ? OR team_after ILIKE ? OR player_last_name ILIKE ? OR player_first_name ILIKE ? OR cast(player_id as text) ILIKE ?", "%#{(params[:search]).strip}%", "%#{(params[:search]).strip}%", "%#{(params[:search]).strip}%", "%#{(params[:search]).strip}%", "#{(params[:search])}").order("player_id ASC, created_at")
		else
			@transactions = Transaction.paginate(:page => params[:page], :per_page => 25).order("id DESC")
		end
	end

	def show
		@transaction = Transaction.find(params[:id])
	end

	def adds
		@transactions = Transaction.adds.paginate(:page => params[:page], :per_page => 25).order("id DESC")
	end

	def drops
		@transactions = Transaction.drops.paginate(:page => params[:page], :per_page => 25).order("id DESC")
	end

end
