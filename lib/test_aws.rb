#!/usr/bin/ruby
# coding: utf-8

require_relative 'evacguide'

reportdb = AWSD.new("eg_report")
crossdb = AWSD.new("eg_cross")

# data = {
#   id: "r5",
#   lat: 36.95155835401599,
#   lng: 140.90637445449832,
#   image_url: "https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1",
#   time: "2023/12/07 12:57:00"
# }
# p reportdb.put(data)

# p reportdb.get({id: "r3"})

# p reportdb.delete({id: "r5"})

# reportdb.get_all_items.each{|item|
#   puts "---"
#   p item
# }

# ==================================================
# crossdb

# data = {
#   id: "c2",
#   lat: 36.962587213312746,
#   lng: 140.9146792984009
# }
# crossdb.put(data)

# crossdb.get_all_items.each{|item|
#   puts "---"
#   p item
# }


# ==================================================
eg = EVACGUIDE.new()

# p eg.removeCross("c2")

# p eg.putCross(36.95107821492136, 140.91079473495486)

#p eg.getAllInfo()
