#!/usr/bin/ruby
# coding: utf-8

require_relative 'aws'

reportdb = AWSD.new("eg_report")
crossdb = AWSD.new("eg_cross")

data = {
  id: "r5",
  lat: 36.95155835401599,
  lng: 140.90637445449832,
  image_url: "https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1",
  time: "2023/12/07 12:57:00"
}
# p reportdb.put(data)

# p reportdb.get({id: "r3"})

# p reportdb.delete({id: "r5"})

reportdb.get_all_items.each{|item|
  puts "---"
  p item
}


