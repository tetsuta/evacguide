# coding: utf-8
require 'json'
require_relative './aws'
require_relative './config'

class EVACGUIDE
  def initialize()
    @reportdb = AWSD.new(AWS_REPORTDB, AWS_REGION)
    @routedb = AWSD.new(AWS_ROUTEDB, AWS_REGION)
    @report_list = []

    @polling_flag = false
    @polling_thread = nil

    # OBSOLETE
    @crossdb = nil
    @cross_list = []
    @cross_index = 0
  end


  def getAllInfo()
    if @polling_flag == false
      # puts "get_all_items"
      @report_list = @reportdb.get_all_items
    else
      # puts "use cache"
    end

    data = {
      "reports" => @report_list
    }
    return data
  end


  def selectRoute(route)
    case route
    when "1"
      @routedb.update({
                        table: "oishi1",
                        application: "oishi1"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi2",
                        application: "oishi2"
                      }, "lat", -800)
    when "2"
      @routedb.update({
                        table: "oishi1",
                        application: "oishi1"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi2",
                        application: "oishi2"
                      }, "lat", 0)
    end
  end


  def startPolling
    @polling_flag = true

    @polling_thread = Thread.new{
      while 1
        # puts "fetching"
        @report_list = @reportdb.get_all_items
        sleep POLLING_INTERVAL
      end
    }
  end


  def stopPolling
    Thread.kill(@polling_thread)

    @polling_flag = false
  end



  ### OBSOLETE ###
  def putCross(lat, lon)
    id = "c#{@cross_index}"
    @cross_index += 1

    data = {
      id: id,
      lat: lat,
      lon: lon
    }

    @cross_list.push(data)
    @crossdb.put(data)
    return cross_table()
  end


  ### OBSOLETE ###
  def removeCross(id)
    @crossdb.delete({id: id})

    @cross_list.each{|cross|
      if cross["id"] == id
        @cross_list.delete(cross)
      end
    }

    return cross_table()
  end


  def close()
  end


  :private
  ### OBSOLETE ###
  def cross_table()
    buffer = ""
    @cross_list.each{|cross|
      buffer << "#{cross["id"]}, #{cross["lat"]}, #{cross["lon"]} <br>\n"
    }
    return buffer
  end

end

