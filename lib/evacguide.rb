# coding: utf-8
require 'json'
require_relative './aws'
require_relative './config'

class Trace
  def initialize(raw_trace)
    @id = raw_trace["application"]
    @time_list = raw_trace["time"]
    @lat_list = raw_trace["lat"]
    @lon_list = raw_trace["lon"]
    @size = @time_list.size
  end


  # return the latest info of point if the time is in begin_time and end_time
  # return nil if there is no data
  def latest_info(begin_time, end_time)
    latest_index = nil
    @time_list.each_index{|index|

      ### DBがきれいになったら消す
      ### この例を排除するため→ "12/14/2023 1:16:28 AM", "12/13/2023 11:33:47 PM"
      next if @time_list[index] =~ /AM/
      next if @time_list[index] =~ /PM/

      # puts @time_list[index]

      time = Time.parse(@time_list[index])
      if begin_time <= time && time < end_time
        latest_index = index
      end
    }

    if latest_index == nil
      return nil
    else
      data = {
        id: @id,
        time: @time_list[latest_index],
        lat: @lat_list[latest_index],
        lon: @lon_list[latest_index]
      }
      return data
    end
  end
end


class EVACGUIDE
  def initialize()
    @reportdb = AWSD.new(AWS_REPORTDB, AWS_REGION)
    @routedb = AWSD.new(AWS_ROUTEDB, AWS_REGION)
    @tracedb = AWSD.new(AWS_TRACEDB, AWS_REGION)
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
      @report_list = @reportdb.get_sorted_all_items
    else
      # puts "use cache"
    end

    data = {
      "reports" => @report_list
    }
    return data
  end


  def getTraces(time)
    end_time = Time.parse(time)
    begin_time = end_time - TraceTimeRange

    # puts begin_time
    # puts end_time

    trace_list = []
    @tracedb.get_all_items.each{|raw_trace|
      trace = Trace.new(raw_trace)

      latest_info = trace.latest_info(begin_time, end_time)
      if latest_info != nil
        trace_list.push(latest_info)
      end
    }
    
    data = {
      "traces" => trace_list
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
        @report_list = @reportdb.get_sorted_all_items
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

