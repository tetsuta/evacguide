#!/usr/bin/ruby
# coding: utf-8

require 'json'
require 'net/http'

host = 'localhost'
port = 8100

http = Net::HTTP.start(host, port)
path = "/"
header = {'Content-Type' => 'application/json'}



data = Hash::new()
data["mode"] = "getReport"
data["lat"] = 36.957683077113025
data["lng"] = 140.9071254730225
response = http.post(path, JSON.generate(data), header)
p response

# responed_data = JSON.parse(response.body)
# puts responed_data["text"]
# puts responed_data["html"]


