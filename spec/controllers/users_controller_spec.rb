require 'rails_helper'

RSpec.describe UsersController, type: :controller do

  describe "GET #index" do
    it "populates an array of users" do
      user = FactoryGirl.create(:user)
      get :index
      expect(assigns(:users)).to eq([user])
    end

    it "renders the :index view" do 
      get :index
      expect(response).to render_template :index
    end
  end



  describe "GET #new" do
    it "renders the :new view" do
      get :new
      expect(response).to render_template :new
    end
  end



  describe "GET #show" do
    it "assignes the requested user to @user" do
      user = FactoryGirl.create(:user)
      get :show, id: user
      expect(assigns(:user)).to eq(user)
    end

    it "renders the :show view" do
      user = FactoryGirl.create(:user)
      get :show, id: user
      expect(response).to render_template :show
    end
  end

  

  describe "POST #create" do
    context "with valid attributes" do
      it "creates a new user" do
        expect{ post :create, user: FactoryGirl.attributes_for(:user) }.to change(User, :count).by(1)
      end

      it "redirects to the new user" do
        post :create, user: FactoryGirl.attributes_for(:user)
        expect(response).to redirect_to User.last
      end
    end

    context "with invalid attributes" do
      it "does not save the new user" do
        expect{ post :create, user: FactoryGirl.attributes_for(:invalid_user) }.to_not change(User, :count)
      end

      it "renders the new method when unsuccessful" do
        post :create, user: FactoryGirl.attributes_for(:invalid_user)
        expect(response).to render_template :new
      end

    end
  end

end
