class User < ActiveRecord::Base
  before_save { self.email = email.downcase }

  validates :name,      presence: true, length: { maximum: 100 }
  validates :email,     presence: true, length: { maximum: 250 },
                        format: { with: /@/ },
                        uniqueness: { case_sensitive: false }
  validates :team,      presence: true, length: { maximum: 100 }

  has_secure_password
  validates :password,  presence: true, length: { minimum: 6 }

end
