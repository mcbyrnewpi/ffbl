class SidebetsController < ApplicationController
  before_action :admin_user,    only: [:new, :create, :edit, :update]

  def index
    @sidebets = Sidebet.all.order("id DESC")
  end


  def new
    @sidebet = Sidebet.new
  end 


  def create
    @sidebet = Sidebet.new(sidebet_params)
    if @sidebet.save
      flash[:success] = "Sidebet Successfully Created!"
      redirect_to sidebets_path
    else
      render 'new'
    end
  end


  def edit
    @sidebet = Sidebet.find(params[:id])
  end


  def update
    @sidebet = Sidebet.find(params[:id])
    if @sidebet.update_attributes(sidebet_params)
      flash[:success] = "Sidebet successfully updated!"
      redirect_to sidebets_path
    else
      render 'edit'
    end
  end


  private

    def sidebet_params
      params.require(:sidebet).permit(:over, :under, :bet_info, :stakes)
    end

    def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end

end
