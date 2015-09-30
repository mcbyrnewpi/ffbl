# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150930164815) do

  create_table "books", force: :cascade do |t|
    t.string   "selector"
    t.string   "title"
    t.string   "author"
    t.text     "summary"
    t.date     "start"
    t.date     "end"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "levels", force: :cascade do |t|
    t.string   "league"
    t.integer  "player_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "player_types", force: :cascade do |t|
    t.string   "kind"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "player_id"
  end

  create_table "players", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "level_id"
    t.integer  "player_type_id"
    t.string   "last_name"
    t.string   "first_name"
    t.date     "dob"
    t.date     "retro"
    t.date     "activate"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
    t.integer  "position_id"
    t.text     "trade_info"
  end

  add_index "players", ["level_id"], name: "index_players_on_level_id"
  add_index "players", ["player_type_id"], name: "index_players_on_player_type_id"
  add_index "players", ["user_id"], name: "index_players_on_user_id"

  create_table "positions", force: :cascade do |t|
    t.integer  "player_id"
    t.string   "spot"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "positions", ["player_id"], name: "index_positions_on_player_id"

  create_table "posts", force: :cascade do |t|
    t.string   "topic"
    t.text     "content"
    t.integer  "user_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.datetime "most_recent"
  end

  add_index "posts", ["user_id"], name: "index_posts_on_user_id"

  create_table "responses", force: :cascade do |t|
    t.text     "reply"
    t.integer  "user_id"
    t.integer  "post_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "responses", ["post_id"], name: "index_responses_on_post_id"
  add_index "responses", ["user_id"], name: "index_responses_on_user_id"

  create_table "transactions", force: :cascade do |t|
    t.string   "team_after"
    t.string   "league_after"
    t.integer  "user_id"
    t.integer  "player_id"
    t.datetime "created_at",        null: false
    t.datetime "updated_at",        null: false
    t.string   "league_before"
    t.string   "team_before"
    t.string   "player_first_name"
    t.string   "player_last_name"
    t.text     "details"
  end

  add_index "transactions", ["player_id"], name: "index_transactions_on_player_id"
  add_index "transactions", ["user_id"], name: "index_transactions_on_user_id"

  create_table "users", force: :cascade do |t|
    t.string   "name"
    t.string   "email"
    t.string   "team"
    t.string   "password_digest"
    t.datetime "created_at",                      null: false
    t.datetime "updated_at",                      null: false
    t.string   "remember_digest"
    t.string   "a"
    t.string   "aa"
    t.string   "aaa"
    t.text     "about"
    t.boolean  "admin",           default: false
    t.boolean  "glctac",          default: false
  end

  add_index "users", ["team"], name: "index_users_on_team"

end
