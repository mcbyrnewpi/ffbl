module SessionsHelper

  # Log in user
  def log_in(user)
    session[:user_id] = user.id
  end

  # Return the current logged-in user (if there is one)
  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
  end

  # Return true if the user is logged in, false if not
  def logged_in?
    !current_user.nil?
  end

  # Logs out the current user
  def log_out
    session.delete(:user_id)
    @current_user = nil
  end

end
