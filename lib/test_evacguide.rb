#!/usr/bin/ruby
# coding: utf-8

require_relative './config'
require_relative './evacguide'
require 'json'

# eg = EVACGUIDE.new()

# puts JSON.generate(eg.getTraces("2023/12/15 23:30"))
# puts JSON.generate(eg.getTraces("2023/12/13 13:23"))

# eg.getAllInfo()

# p eg.getAllTraces("2023/12/13 13:23")
# p eg.getRouteHistory("2024/1/24 21:56:00")


# eg.getRouteStatus()
# p eg.getAllTraces("2024/02/15 14:00:00")

tracedb = AWSD.new(AWS_TRACEDB, AWS_REGION)

# tracedb.get_all_items.each{|item|
#   puts JSON.generate(item)
# }
# ---
# ARGF.each{|line|
#   data = JSON.parse(line.chomp)
#   print data["application"]
#   print "\t"
#   puts line.size
# }

# items = tracedb.get_all_items()
# items.each{|item|
#   puts item["application"]
# }

# items = tracedb.tt("SessionID20240215")

# items = tracedb.get_cond_items({"application" => "SessionID20240221"})
items = tracedb.get_all_items()
# p items
puts "sum"
puts items.size
items.each{|item|
  puts item["application"]
}



# ARGF.each{|line|
#   puts line.size
# }


