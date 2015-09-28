Rails.application.routes.draw do
  get 'posts/index'

  get 'posts/show'

  get 'posts/new'

  get 'posts/create'

  get 'posts/destroy'

  get 'sessions/new'

  root 'static_pages#home'
  get  'about'              => 'static_pages#about'
  get  'rules'              => 'static_pages#rules'
  get  'documents'          => 'static_pages#documents'
  get  'champions'          => 'static_pages#champions'
  get  'player_records'     => 'static_pages#player_records'
  get  'team_records'       => 'static_pages#team_records'
  get  'signup'             => 'users#new'
  get  'login'              => 'sessions#new'
  post 'login'              => 'sessions#create'
  delete 'logout'           => 'sessions#destroy'
  get  'all_mlb'            => 'players#display_mlb'
  get  'all_milb'           => 'players#display_milb'
  get  'all_sixtyday'       => 'players#display_sixtyday'
  get  'all_unowned'        => 'players#display_unowned'
  get  'all_catchers'       => 'players#catcher_sort'
  get  'all_first'          => 'players#all_first'
  get  'all_second'         => 'players#all_second'
  get  'all_short'          => 'players#all_short'
  get  'all_third'          => 'players#all_third'
  get  'all_of'             => 'players#all_of'
  get  'all_rp'             => 'players#all_rp'
  get  'all_sp'             => 'players#all_sp'
  get  'all_transactions'   => 'transactions#index'
  get  'team_violations'    => 'static_pages#team_violations'
  
  get  'players/:id/drop_player', to: 'players#drop_player', as: 'drop_player'
  get  'players/:id/add_player', to: 'players#add_player', as: 'add_player'

  resources :users
  resources :players
  resources :positions
  resources :levels
  resources :players
  resources :transactions
  resources :posts
  resources :responses

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
