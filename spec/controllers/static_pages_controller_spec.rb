require 'rails_helper'

RSpec.describe StaticPagesController, type: :controller do

  describe "GET #home" do
    it "returns http success" do
      get :home
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #about" do
    it "returns http success" do
      get :about
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #rules" do
    it "returns http success" do
      get :rules
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #documents" do
    it "returns http success" do
      get :documents
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #champions" do
    it "returns http success" do
      get :champions
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #player_records" do
    it "returns http success" do
      get :player_records
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #team_records" do
    it "returns http success" do
      get :team_records
      expect(response).to have_http_status(:success)
    end
  end

end
