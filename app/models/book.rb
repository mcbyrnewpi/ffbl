class Book < ActiveRecord::Base

	has_many :reviews

	validates :selector, 		presence: true
	validates :title, 			presence: true
	validates :author,			presence: true
	validates :summary, 		presence: true
	validates :start, 			presence: true
	validates :end, 				presence: true
end
