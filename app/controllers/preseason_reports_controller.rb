class PreseasonReportsController < ApplicationController
  before_action :varnum_user,   only: [:new, :create, :edit, :update]

  def new
    @preseason_report = PreseasonReport.new
  end

  def create
    @preseason_report = PreseasonReport.new(preseason_reports_params)
    if @preseason_report.save
      flash[:success] = "Preseason Report Successfully Created!"
      redirect_to @preseason_report
    else
      render 'new'
    end 
  end

  def edit
    @preseason_report = PreseasonReport.find(params[:id])
  end

  def update
    @preseason_report = PreseasonReport.find(params[:id])
    if @preseason_report.update_attributes(preseason_reports_params)
      flash[:success] = "Preseason Report updated!"
      redirect_to @preseason_report
    else
      render 'edit'
    end
  end

  def show
    @preseason_report = PreseasonReport.find(params[:id])
    @user = @preseason_report.user
    @preseason_reports = @user.preseason_reports.all
  end


  private

    def preseason_reports_params
      params.require(:preseason_report).permit(:user_id, :report_title, :report_content, :prospect1, :prospect2, :prospect3, :prospect4, :prospect5, :prospect6, :prospect7, :prospect8, :prospect9, :prospect10, :proj_year, :catch, :first, :second, :third, :short, :of1, :of2, :of3, :util1, :util2, :sp1, :sp2, :sp3, :rp1, :rp2, :rp3, :p1, :p2, :bench1, :bench2, :bench3, :bench4, :bench5, :bench6, :bench7, :pyr1, :pyr2, :pyr3, :pyr4, :pyr5, :pyr6, :pyr7, :pyr8, :pyr9, :pyr10, :past_prospect1, :past_prospect2, :past_prospect3, :past_prospect4, :past_prospect5, :past_prospect6, :past_prospect7, :past_prospect8, :past_prospect9, :past_prospect10, :pcurrent1, :pcurrent2, :pcurrent3, :pcurrent4, :pcurrent5, :pcurrent6, :pcurrent7, :pcurrent8, :pcurrent9, :pcurrent10, :dpyr1, :dpyr2, :dpyr3, :dpyr4, :dpyr5, :dpyr6, :dpyr7, :dpyr8, :dpyr9, :dpyr10, :draft_pick1, :draft_pick2, :draft_pick3, :draft_pick4, :draft_pick5, :draft_pick6, :draft_pick7, :draft_pick8, :draft_pick9, :draft_pick10, :dpcurrent1, :dpcurrent2, :dpcurrent3, :dpcurrent4, :dpcurrent5, :dpcurrent6, :dpcurrent7, :dpcurrent8, :dpcurrent9, :dpcurrent10)
    end

    def varnum_user
      redirect_to(root_url) unless logged_in? && current_user.varnum == true
    end
end
