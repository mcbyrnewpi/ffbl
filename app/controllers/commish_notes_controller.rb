class CommishNotesController < ApplicationController

  before_action :commish, only: [:edit, :update, :create]
  before_action :logged_in_user, only: [:index]

  def create
    @commish_note = CommishNote.new(commish_note_params)
    if @commish_note.save
      flash[:success] = "Commish Note Created!"
      redirect_to root_url
    else
      redirect_to commissioner_path
    end
  end

  def edit
    @commish_note = CommishNote.find(params[:id])
  end

  def update
    @commish_note = CommishNote.find(params[:id])
    if @commish_note.update_attributes(user_params)
      flash[:success] = "Commish Note Updated!"
      redirect_to root_url
    else
      render 'edit'
    end
  end

  def index
    @commish_notes = CommishNote.all.order("id DESC")
  end


  private

    def commish_note_params
      params.require(:commish_note).permit(:commish_note_content)
    end

    def commish
      redirect_to(root_url) unless logged_in? && current_user.commish?
    end

    def logged_in_user
      unless logged_in?
        store_location
        flash[:danger] = "Please log in."
        redirect_to login_url
      end
    end
end
