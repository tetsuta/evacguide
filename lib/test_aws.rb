#!/usr/bin/ruby
# coding: utf-8

require_relative 'evacguide'

# reportdb = AWSD.new("eg_report")
# crossdb = AWSD.new("eg_cross")

oishi2 = AWSD.new("Oishi2", "ap-northeast-1")
oishi3 = AWSD.new("Oishi3", "ap-northeast-1")
oishi4 = AWSD.new("Oishi4", "ap-northeast-1")

# ### check oishi2
# items = oishi2.get_all_items()
# items.each{|item|
#   puts "---"
#   p item
# }

# ==================================================
### add report
# data = {
#   "lon"=>"130.339675875853",
#   "lat"=>"33.5809082979102",
#   "table"=>"2023/12/08 20:02:24",
#   "application"=>"INFO",
#   "URL"=>"https://oishibucket.s3.ap-northeast-1.amazonaws.com/ScreenShot_20231208200219390.png"
# }

# data = {
#   "lat"=> "33.58089738134409",
#   "lon"=> "130.34000515937808",
#   "table"=>"2025/12/08 20:02:24",
#   "application"=>"INFO",
#   "URL"=>"https://oishibucket.s3.ap-northeast-1.amazonaws.com/ScreenShot_20231208200219390.png"
# }
# p oishi3.put(data)




# # ==================================================
### check oishi3
# p oishi3.delete({
#                table: "2024/12/08 20:02:24",
#                application: "INFO"
# })

# oishi3.update({
#                 table: "2024/12/08 20:02:24",
#                 application: "INFO"
#               }, "lat", "33.58091078872473"
# )

# items = oishi3.get_all_items()
# items.each{|item|
#   puts "---"
#   p item
# }

# ==================================================
items = oishi4.get_all_items()
items.each{|item|
  puts "---"
  p item
}



# data = {
#   id: "r4",
#   lat: 36.95155835401599,
#   lon: 140.90637445449832,
#   image_url: "https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1",
#   time: "2023/12/07 12:57:00"
# }
# p reportdb.put(data)

# p reportdb.get({id: "r3"})

# p reportdb.delete({id: "r3"})
# p reportdb.delete({id: "r4"})

# reportdb.get_all_items.each{|item|
#   puts "---"
#   p item
# }

# ==================================================
# crossdb

# data = {
#   id: "c2",
#   lat: 36.962587213312746,
#   lon: 140.9146792984009
# }
# crossdb.put(data)

# crossdb.delete({id: "c2"})
# crossdb.delete({id: "c0"})

# crossdb.get_all_items.each{|item|
#   puts "---"
#   p item
# }


# ==================================================
# eg = EVACGUIDE.new()

# p eg.removeCross("c2")

# p eg.putCross(36.95107821492136, 140.91079473495486)

#p eg.getAllInfo()
