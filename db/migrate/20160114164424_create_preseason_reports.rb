class CreatePreseasonReports < ActiveRecord::Migration
  def change
    create_table :preseason_reports do |t|

      t.string    :report_title
      t.text      :report_content

      t.string    :prospect1
      t.string    :prospect2
      t.string    :prospect3
      t.string    :prospect4
      t.string    :prospect5
      t.string    :prospect6
      t.string    :prospect7
      t.string    :prospect8
      t.string    :prospect9
      t.string    :prospect10

      t.string    :catch
      t.string    :first
      t.string    :second
      t.string    :third
      t.string    :short
      t.string    :of1
      t.string    :of2
      t.string    :of3
      t.string    :util1
      t.string    :util2
      t.string    :sp1
      t.string    :sp2
      t.string    :sp3
      t.string    :rp1
      t.string    :rp2
      t.string    :rp3
      t.string    :p1
      t.string    :p2
      t.string    :bench1
      t.string    :bench2
      t.string    :bench3
      t.string    :bench4
      t.string    :bench5
      t.string    :bench6
      t.string    :bench7

      t.integer   :pyr1
      t.integer   :pyr2
      t.integer   :pyr3
      t.integer   :pyr4
      t.integer   :pyr5
      t.integer   :pyr6
      t.integer   :pyr7
      t.integer   :pyr8
      t.integer   :pyr9
      t.integer   :pyr10

      t.string    :past_prospect1
      t.string    :past_prospect2
      t.string    :past_prospect3
      t.string    :past_prospect4
      t.string    :past_prospect5
      t.string    :past_prospect6
      t.string    :past_prospect7
      t.string    :past_prospect8
      t.string    :past_prospect9
      t.string    :past_prospect10

      t.string    :pcurrent1
      t.string    :pcurrent2
      t.string    :pcurrent3
      t.string    :pcurrent4
      t.string    :pcurrent5
      t.string    :pcurrent6
      t.string    :pcurrent7
      t.string    :pcurrent8
      t.string    :pcurrent9
      t.string    :pcurrent10

      t.integer   :dpyr1
      t.integer   :dpyr2
      t.integer   :dpyr3
      t.integer   :dpyr4
      t.integer   :dpyr5
      t.integer   :dpyr6
      t.integer   :dpyr7
      t.integer   :dpyr8
      t.integer   :dpyr9
      t.integer   :dpyr10

      t.string    :draft_pick1
      t.string    :draft_pick2
      t.string    :draft_pick3
      t.string    :draft_pick4
      t.string    :draft_pick5
      t.string    :draft_pick6
      t.string    :draft_pick7
      t.string    :draft_pick8
      t.string    :draft_pick9
      t.string    :draft_pick10

      t.string    :dpcurrent1
      t.string    :dpcurrent2
      t.string    :dpcurrent3
      t.string    :dpcurrent4
      t.string    :dpcurrent5
      t.string    :dpcurrent6
      t.string    :dpcurrent7
      t.string    :dpcurrent8
      t.string    :dpcurrent9
      t.string    :dpcurrent10


      t.references :user, index: true, foreign_key: true
      t.timestamps null: false
    end
  end
end
