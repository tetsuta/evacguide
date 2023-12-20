#!/usr/bin/ruby
# coding: utf-8

require_relative './config'
require_relative './evacguide'
require 'json'

eg = EVACGUIDE.new()

# puts JSON.generate(eg.getTraces("2023/12/15 23:30"))
puts JSON.generate(eg.getTraces("2023/12/13 13:23"))



