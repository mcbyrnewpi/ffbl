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

ActiveRecord::Schema.define(version: 20160203003653) do

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

  create_table "commish_notes", force: :cascade do |t|
    t.text     "commish_note_content"
    t.datetime "created_at",           null: false
    t.datetime "updated_at",           null: false
  end

  create_table "levels", force: :cascade do |t|
    t.string   "league"
    t.integer  "player_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "player_types", force: :cascade do |t|
    t.string   "type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.string   "affiliation"
    t.text     "player_note"
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

  create_table "preseason_reports", force: :cascade do |t|
    t.string   "report_title"
    t.text     "report_content"
    t.string   "prospect1"
    t.string   "prospect2"
    t.string   "prospect3"
    t.string   "prospect4"
    t.string   "prospect5"
    t.string   "prospect6"
    t.string   "prospect7"
    t.string   "prospect8"
    t.string   "prospect9"
    t.string   "prospect10"
    t.string   "catch"
    t.string   "first"
    t.string   "second"
    t.string   "third"
    t.string   "short"
    t.string   "of1"
    t.string   "of2"
    t.string   "of3"
    t.string   "util1"
    t.string   "util2"
    t.string   "sp1"
    t.string   "sp2"
    t.string   "sp3"
    t.string   "rp1"
    t.string   "rp2"
    t.string   "rp3"
    t.string   "p1"
    t.string   "p2"
    t.string   "bench1"
    t.string   "bench2"
    t.string   "bench3"
    t.string   "bench4"
    t.string   "bench5"
    t.string   "bench6"
    t.string   "bench7"
    t.integer  "pyr1"
    t.integer  "pyr2"
    t.integer  "pyr3"
    t.integer  "pyr4"
    t.integer  "pyr5"
    t.integer  "pyr6"
    t.integer  "pyr7"
    t.integer  "pyr8"
    t.integer  "pyr9"
    t.integer  "pyr10"
    t.string   "past_prospect1"
    t.string   "past_prospect2"
    t.string   "past_prospect3"
    t.string   "past_prospect4"
    t.string   "past_prospect5"
    t.string   "past_prospect6"
    t.string   "past_prospect7"
    t.string   "past_prospect8"
    t.string   "past_prospect9"
    t.string   "past_prospect10"
    t.string   "pcurrent1"
    t.string   "pcurrent2"
    t.string   "pcurrent3"
    t.string   "pcurrent4"
    t.string   "pcurrent5"
    t.string   "pcurrent6"
    t.string   "pcurrent7"
    t.string   "pcurrent8"
    t.string   "pcurrent9"
    t.string   "pcurrent10"
    t.integer  "dpyr1"
    t.integer  "dpyr2"
    t.integer  "dpyr3"
    t.integer  "dpyr4"
    t.integer  "dpyr5"
    t.integer  "dpyr6"
    t.integer  "dpyr7"
    t.integer  "dpyr8"
    t.integer  "dpyr9"
    t.integer  "dpyr10"
    t.string   "draft_pick1"
    t.string   "draft_pick2"
    t.string   "draft_pick3"
    t.string   "draft_pick4"
    t.string   "draft_pick5"
    t.string   "draft_pick6"
    t.string   "draft_pick7"
    t.string   "draft_pick8"
    t.string   "draft_pick9"
    t.string   "draft_pick10"
    t.string   "dpcurrent1"
    t.string   "dpcurrent2"
    t.string   "dpcurrent3"
    t.string   "dpcurrent4"
    t.string   "dpcurrent5"
    t.string   "dpcurrent6"
    t.string   "dpcurrent7"
    t.string   "dpcurrent8"
    t.string   "dpcurrent9"
    t.string   "dpcurrent10"
    t.integer  "user_id"
    t.datetime "created_at",      null: false
    t.datetime "updated_at",      null: false
    t.integer  "proj_year"
  end

  add_index "preseason_reports", ["user_id"], name: "index_preseason_reports_on_user_id"

  create_table "responses", force: :cascade do |t|
    t.text     "reply"
    t.integer  "user_id"
    t.integer  "post_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "responses", ["post_id"], name: "index_responses_on_post_id"
  add_index "responses", ["user_id"], name: "index_responses_on_user_id"

  create_table "reviews", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "book_id"
    t.text     "thoughts"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "reviews", ["book_id"], name: "index_reviews_on_book_id"
  add_index "reviews", ["user_id"], name: "index_reviews_on_user_id"

  create_table "sidebets", force: :cascade do |t|
    t.string   "over"
    t.string   "under"
    t.text     "bet_info"
    t.string   "stakes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string   "winner"
  end

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
    t.boolean  "varnum",          default: false
    t.boolean  "commish",         default: false
  end

  add_index "users", ["team"], name: "index_users_on_team"

end
