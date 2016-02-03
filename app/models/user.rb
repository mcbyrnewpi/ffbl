class User < ActiveRecord::Base
  attr_accessor :remember_token

  has_many :players
  has_many :levels
  has_many :transactions
  has_many :posts
  has_many :responses
  has_many :reviews
  has_many :preseason_reports
  has_many :commish_notes

  before_save { self.email = email.downcase }

  validates :name,      presence: true, length: { maximum: 100 }
  validates :email,     presence: true, length: { maximum: 250 },
                        format: { with: /@/ },
                        uniqueness: { case_sensitive: false }
  validates :team,      presence: true, length: { maximum: 100 }

  has_secure_password
  validates :password,  presence: true, length: { minimum: 6 }, allow_nil: true

  # Returns the hash digest of the given string.
  def User.digest(string)
    cost = ActiveModel::SecurePassword.min_cost ? BCrypt::Engine::MIN_COST :
                                                  BCrypt::Engine.cost
    BCrypt::Password.create(string, cost: cost)
  end

  # Returns a random token
  def User.new_token
    SecureRandom.urlsafe_base64
  end

  # Remembers a user in the db for use in persistent session
  def remember
    self.remember_token = User.new_token
    update_attribute(:remember_digest, User.digest(remember_token))
  end

  # Returns true if the given token matches the digest
  def authenticated?(remember_token) 
    return false if remember_digest.nil?
    BCrypt::Password.new(remember_digest).is_password?(remember_token)
  end

  # Forgets a user
  def forget
    update_attribute(:remember_digest, nil)
  end

end
