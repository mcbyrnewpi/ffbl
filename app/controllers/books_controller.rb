class BooksController < ApplicationController
  before_action :glctac_user, only: [:index, :new, :create, :show]

  def index
  	@books = Book.all
  end

  def new
    @book = Book.new
  end

  def create
    @book = Book.new(book_params)
    if @book.save
      flash[:success] = "Selection Successfully Created!"
      redirect_to @book
    else
      render 'new'
    end 
  end

  def show
  	@book = Book.find(params[:id])
  end

  private 

  	def book_params
      params.require(:book).permit(:selector, :title, :author, :summary, :start, :end)
    end

    def glctac_user
      redirect_to(root_url) unless logged_in? && current_user.glctac == true
    end
end
