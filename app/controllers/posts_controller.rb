class PostsController < ApplicationController
  before_action :logged_in_user, only: [:new, :create]
  before_action :admin_user, only: [:destroy]

  def index
    @posts = Post.paginate(:page => params[:page], :per_page => 25).order("most_recent DESC")
  end

  def show
    @post = Post.find(params[:id])
    @responses = @post.responses.all
  end

  def new
    @post = Post.new
  end

  def create
    @post = Post.new(post_params)
    if @post.save
      flash[:success] = "Your post has been successfully created!"
      redirect_to @post
    else
      flash[:danger] = "Post could not be created.  Please try again."
      render 'new'
    end
  end

  def destroy
    Post.find(params[:id]).destroy
    flash[:success] = "Position deleted"
    redirect_to posts_path
  end

  private

    def post_params
      params.require(:post).permit(:topic, :content, :user_id, :most_recent)
    end

    def admin_user
      redirect_to(root_url) unless logged_in? && current_user.admin?
    end

    def logged_in_user
      unless logged_in?
        store_location
        flash[:danger] = "Please log in."
        redirect_to login_url
      end
    end
end
