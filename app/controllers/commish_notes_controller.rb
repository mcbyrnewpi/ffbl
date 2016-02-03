class CommishNotesController < ApplicationController

  before_action :commish, only: [:edit, :update]

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


  private

    def commish_note_params
      params.require(:commish_note).permit(:commish_note_content)
    end

    def commish
      redirect_to(root_url) unless logged_in? && current_user.commish?
    end
end
