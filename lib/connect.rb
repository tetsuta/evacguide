#!/usr/bin/ruby
# coding: utf-8

require 'json'
require 'net/http'
require 'getoptlong'

opts = GetoptLong.new(
 		      [ "--mode", "-m", GetoptLong::REQUIRED_ARGUMENT ],
		      [ "--help", "-h", GetoptLong::NO_ARGUMENT ]
		      )

def printHelp(message)
  STDERR.print message
  exit(1)
end

USAGE_MESSAGE = "
Usage:
 ./connect.rb [-h] [-m mode]

mode:
getAllInfo
getUpdateReport
putCross
removeCross

"

mode = nil
opts.each{|opt, arg|
  case opt
  when "--help"
    printHelp(USAGE_MESSAGE)
  when "--mode"
    mode = arg
  end
}

if mode == nil
  printHelp(USAGE_MESSAGE)
end


# ==================================================
host = 'localhost'
port = 8100

http = Net::HTTP.start(host, port)
path = "/"
header = {'Content-Type' => 'application/json'}


case mode
when "getAllInfo"
  data = Hash::new()
  data["mode"] = mode
  response = http.post(path, JSON.generate(data), header)
  data = JSON.parse(response.body)
  data["reports"].each{|report|
    p report
  }
  data["crosses"].each{|cross|
    p cross
  }

when "getUpdateReport"
  data = Hash::new()
  data["mode"] = mode
  response = http.post(path, JSON.generate(data), header)
  data = JSON.parse(response.body)
  p data

when "putCross"
  data = Hash::new()
  data["mode"] = mode
  data["lat"] = 36.95107821492136
  data["lng"] = 140.91079473495486

  response = http.post(path, JSON.generate(data), header)
  data = JSON.parse(response.body)
  p data

when "removeCross"
  data = Hash::new()
  data["mode"] = mode
  data["id"] = "c1"

  response = http.post(path, JSON.generate(data), header)
  data = JSON.parse(response.body)
  p data

end





# data["lat"] = 36.957683077113025
# data["lng"] = 140.9071254730225
# response = http.post(path, JSON.generate(data), header)
# p response


# responed_data = JSON.parse(response.body)
# puts responed_data["text"]
# puts responed_data["html"]


