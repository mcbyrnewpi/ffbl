class User < ActiveRecord::Base
  has_many :players
  has_many :levels

  before_save { self.email = email.downcase }

  validates :name,      presence: true, length: { maximum: 100 }
  validates :email,     presence: true, length: { maximum: 250 },
                        format: { with: /@/ },
                        uniqueness: { case_sensitive: false }
  validates :team,      presence: true, length: { maximum: 100 }

  has_secure_password
  validates :password,  presence: true, length: { minimum: 6 }

  # Returns the hash digest of the given string.
  def User.digest(string)
    cost = ActiveModel::SecurePassword.min_cost ? BCrypt::Engine::MIN_COST :
                                                  BCrypt::Engine.cost
    BCrypt::Password.create(string, cost: cost)
  end

end
