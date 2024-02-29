#!/usr/bin/ruby
# coding: utf-8

require 'getoptlong'
require 'webrick'
require 'webrick/https'
require 'net/protocol'
require 'logger'

require_relative './config'
require_relative './evacguide'

# -------------------------------------------------- #
opts = GetoptLong.new([ "--help", "-h", GetoptLong::NO_ARGUMENT ] )

def printHelp(message)
  STDERR.print message
  exit(1)
end

USAGE_MESSAGE = "
Extract recent messages

Usage:
 ./server.rb [-h]

-h: show help messsage
"

bot_name = nil
opts.each{|opt, arg|
  case opt
  when "--help"
    printHelp(USAGE_MESSAGE)
  end
}


# --------------------------------------------------
$logger = Logger.new(LogFile, LogAge, LogSize*1024*1024)
case LogLevel
when :fatal then
  $logger.level = Logger::FATAL
when :error then
  $logger.level = Logger::ERROR
when :warn then
  $logger.level = Logger::WARN
when :info then
  $logger.level = Logger::INFO
when :debug then
  $logger.level = Logger::DEBUG
end

eg = EVACGUIDE.new()

options = {
  :Port => SystemPort,
  :BindAddress => SystemBindAddress,
  :DoNotReverseLookup => true
}

if (UseSSL)
  options.store(:SSLEnable, true)
  options.store(:SSLVerifyClient, OpenSSL::SSL::VERIFY_NONE)
  options.store(:SSLCertificate, OpenSSL::X509::Certificate.new(open(SSLCertFile).read))
  options.store(:SSLPrivateKey, OpenSSL::PKey::RSA.new(open(SSLCertKeyFile).read))
end

s = WEBrick::HTTPServer.new(options)

s.mount_proc('/'){|request, response|
  errormsg = "request body error."
  begin
    data = Hash::new

    if (request.request_method != "POST")
      errormsg = "HTTP method error."
      raise ArgumentError.new(errormsg)
    end
    if (request.content_type == nil)
      errormsg = "content-type error."
      raise ArgumentError.new(errormsg)
    end
    if (request.body == nil)
      errormsg = "request body error. bodysize=nil"
      raise ArgumentError.new(errormsg)
    end

    userInput = JSON.parse(request.body)
    mode = userInput["mode"]

    case mode
    when "getAllInfo"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("getAllInfo")
      all_info = eg.getAllInfo()
      data["reports"] = all_info["reports"]
      data["crosses"] = all_info["crosses"]
      response.body = JSON.generate(data)

    when "getRouteStatus"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("getRouteStatus")
      ret_data = eg.getRouteStatus()
      data["route_status"] = ret_data["route_status"]
      response.body = JSON.generate(data)

    when "getRouteHisoty"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("getRouteHistory")
      time = userInput["time"]
      ret_data = eg.getRouteHistory(time)
      data["route_history"] = ret_data["route_history"]
      response.body = JSON.generate(data)

    when "getAllTraces"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("getAllTraces")
      time = userInput["time"]
      ret_data = eg.getAllTraces(time)
      data["trace_history"] = ret_data["trace_history"]
      response.body = JSON.generate(data)

    when "getDailyTraces"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("getDailyTraces")
      time = userInput["time"]
      ret_data = eg.getDailyTraces(time)
      data["trace_history"] = ret_data["trace_history"]
      response.body = JSON.generate(data)

    when "getTraces"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("getTraces")
      time = userInput["time"]
      ret_data = eg.getTraces(time)
      data["traces"] = ret_data["traces"]
      response.body = JSON.generate(data)

    when "startPolling"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("startPolling")
      eg.startPolling
      response.body = JSON.generate(data)

    when "stopPolling"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("stopPolling")
      eg.stopPolling
      response.body = JSON.generate(data)

    when "setOnahamaRoute"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("selectRoute")
      route = userInput["route"]

      puts "----"
      puts "setOnahamaRoute"
      puts route
      eg.setOnahamaRoute(route)

      response.body = JSON.generate(data)

    when "selectRoute"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("selectRoute")
      route = userInput["route"]
      eg.selectRoute(route)
      response.body = JSON.generate(data)

    ### OBSOLETE ###
    when "getUpdateReport"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("getUpdateReport")
      data["reports"] = eg.getUpdateReport()
      response.body = JSON.generate(data)

    ### OBSOLETE ###
    when "putCross"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("putCross: #{userInput["lat"]}, #{userInput["lon"]}")
      data["html"] = eg.putCross(userInput["lat"], userInput["lon"])
      response.body = JSON.generate(data)

    ### OBSOLETE ###
    when "removeCross"
      $logger.info("connection: :#{request.peeraddr.to_s}")
      $logger.info("putCross: #{userInput["lat"]}, #{userInput["lon"]}")
      data["html"] = eg.removeCross(userInput["id"])
      response.body = JSON.generate(data)

    end

  rescue Exception => e
    $logger.fatal(e.message)
    $logger.fatal(e.class)
    $logger.fatal e.backtrace
    errdata = Hash::new
    errbody = Hash::new
    case e
    when Net::ReadTimeout then
      response.status = 408
    when Net::ProtoAuthError then
      response.status = 401
    else
      response.status = 500
    end
    errbody["code"] = response.status
    errbody["message"] = e.message
    errdata["error"] = errbody
    response.body = JSON.generate(errdata)
  ensure
    if (HTTPAccessControl != nil && HTTPAccessControl != "")
      response.header["Access-Control-Allow-Origin"] = HTTPAccessControl
    end
    response.content_type = "application/json; charset=UTF-8"
  end
}

Signal.trap(:INT){
  s.shutdown
}

s.start
eg.close()

