# coding: utf-8
require 'json'
require_relative './aws'
require_relative './config'

class Trace
  attr_reader :id, :is_valid

  def initialize(raw_trace)
    @id = raw_trace["application"]
    @time_list = raw_trace["time"]
    @lat_list = raw_trace["lat"]
    @lon_list = raw_trace["lon"]
    @size = @time_list.size
    @is_valid = true

    # ------------------------------
    # 緊急デバッグ(2024-1-25(Thu))
    # 部分的にデータが記録されないところがあったので、マージしたデータを
    # "lat"に記録することにした。
    
    merged_list = @lat_list.dup
    @time_list = []
    @lat_list = []
    @lon_list = []

    num_of_entity = 0
    merged_list.each{|merged_data|
      elems = merged_data.split(",")
      @lat_list.push(elems[0])
      @lon_list.push(elems[1])
      @time_list.push(elems[2])
      num_of_entity = elems.size
    }

    # イレギュラーなデータへの対応
    #  latに 3つの情報が入っていない場合は不適格とする
    if num_of_entity < 3
      @is_valid = false
      return nil
    end

    @size = @time_list.size
    # ------------------------------

    @parsed_time_list = []
    @time_list.each{|time_str|
      if time_str =~ /[AP]M/
        @parsed_time_list.push(nil)
      else
        @parsed_time_list.push(Time.parse(time_str))
      end
    }

  end


  # return all trace info between begin_time and end_time
  def history(begin_time, end_time)

    available_index_list = []
    @time_list.each_index{|index|

      ### DBがきれいになったら消す
      ### この例を排除するため→ "12/14/2023 1:16:28 AM", "12/13/2023 11:33:47 PM"
      next if @time_list[index] =~ /AM/
      next if @time_list[index] =~ /PM/

      if begin_time <= @parsed_time_list[index] && @parsed_time_list[index] < end_time
        available_index_list.push(index)
      end
    }

    ret_list = []
    available_index_list.each{|index|
      data = {
        time: @time_list[index],
        stime: @parsed_time_list[index].to_i,
        lat: @lat_list[index],
        lon: @lon_list[index]
      }
      ret_list.push(data)
    }

    ret_list.sort!{|a,b|
      a[:stime] <=> b[:stime]
    }

    return ret_list
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
        sid: @id,
        time: @time_list[latest_index],
        stime: @parsed_time_list[latest_index].to_i,
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
    @maplogdb = AWSD.new(AWS_MAPLOG, AWS_REGION)
    @report_list = []

    @polling_flag = false
    @polling_thread = nil

    # OBSOLETE
    @crossdb = nil
    @cross_list = []
    @cross_index = 0
  end


  # time(s)以降のルートの変更情報のリストを時刻でソートして返す
  def getRouteHistory(time)
    begin_time = Time.parse(time)
    time_msec = begin_time.to_i * 1000

    maplog_list = @maplogdb.get_all_items
    ret_list = maplog_list.filter{|h| h["msec"] > time_msec}.sort{|a,b|
      a["msec"] <=> b["msec"]
    }

    # ret_list.each{|maplog|
    #   puts "---"
    #   p maplog
    # }
    
    data = {
      "route_history" => ret_list
    }

    return data
  end


  # すべての reportを返す
  def getAllInfo()
    if @polling_flag == false
      # puts "get_all_items"
      @report_list = @reportdb.get_sorted_all_items
    else
      # puts "use cache"
    end

    # ------------------------------
    # 緊急デバッグ(2024-1-25(Thu))
    # 部分的にデータが記録されないところがあったので、マージしたデータを
    # "lat"に記録することにした。
    @report_list.each{|report|
      elems = report["lat"].split(",")
      report["lat"] = elems[0]
    }
    # ------------------------------

    data = {
      "reports" => @report_list
    }
    return data
  end


  # time以降のすべての traceを返す
  def getAllTraces(time)
    end_time = Time.now()
    begin_time = Time.parse(time)

    trace_set = {}
    @tracedb.get_all_items.each{|raw_trace|
      trace = Trace.new(raw_trace)
      next unless trace.is_valid

      trace_history = trace.history(begin_time, end_time)
      if trace_history.size > 0
        trace_set[trace.id] = trace_history
      end
    }
    
    data = {
      "trace_history" => trace_set
    }
    return data

  end


  # timeの日の中で time以降のすべての traceを返す
  def getDailyTraces(time)
    end_time = Time.now()
    begin_time = Time.parse(time)

    datestr = begin_time.strftime("%Y%m%d")
    cond_list = []
    cond_list.push({"application" => "SessionID#{datestr}"})
    cond_list.push({"application" => "ARI_SessionID#{datestr}"})
    cond_list.push({"application" => "NASI_SessionID#{datestr}"})

    trace_set = {}

    cond_list.each{|cond|
      @tracedb.get_cond_items(cond).each{|raw_trace|
        trace = Trace.new(raw_trace)
        next unless trace.is_valid

        trace_history = trace.history(begin_time, end_time)
        if trace_history.size > 0
          trace_set[trace.id] = trace_history
        end
      }
    }
    
    data = {
      "trace_history" => trace_set
    }
    return data

  end


  ### tracedb内のすべての項目のうち
  ### timeから過去 TraceTimeRangeの間の最新の trace情報を返す
  def getTraces(time)
    end_time = Time.parse(time)
    begin_time = end_time - TraceTimeRange

    datestr = end_time.strftime("%Y%m%d")
    cond_list = []
    cond_list.push({"application" => "SessionID#{datestr}"})
    cond_list.push({"application" => "ARI_SessionID#{datestr}"})
    cond_list.push({"application" => "NASI_SessionID#{datestr}"})
    
    trace_list = []

    cond_list.each{|cond|
      @tracedb.get_cond_items(cond).each{|raw_trace|
        trace = Trace.new(raw_trace)
        next unless trace.is_valid

        latest_info = trace.latest_info(begin_time, end_time)
        if latest_info != nil
          trace_list.push(latest_info)
        end
      }
    }
    
    data = {
      "traces" => trace_list
    }
    return data

  end


  # put Onahama route log
  def putOnahamaRouteLog(point, action)
    time = Time.now()

    key = "onahama_#{point}_#{action}_#{time.strftime("%Y%m%d%H%M%S%L")}"
    time_str = time.strftime("%Y/%m/%d %H:%M:%S")
    time_msec = time.to_i * 1000

    data = {
      application: key,
      time: time_str,
      msec: time_msec,
      area: "onahama",
      point: point,
      action: action
    }
    
    # puts "put"
    # p data

    @maplogdb.put(data)
  end


  def getRouteStatus()
    route_info_list = @routedb.get_all_items

    # default
    route_status = {}
    1.upto(6){|i|
      route_status[i.to_s] = "v"
    }

    route_info_list.each{|route_info|
      if route_info["table"] =~ /oishi([0-9]+)([vh])/
        id = $1
        value = $2
        if route_info["lat"] == 0
          route_status[id] = value
        end
      end

    }
    data = {
      "route_status" => route_status
    }

    return data
  end


  # Onahama
  def setOnahamaRoute(route)
    case route
    when "1h"
      putOnahamaRouteLog("1", "h")
      @routedb.update({
                        table: "oishi1h",
                        application: "oishi1h"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi1v",
                        application: "oishi1v"
                      }, "lat", -800)
    when "1v"
      putOnahamaRouteLog("1", "v")
      @routedb.update({
                        table: "oishi1h",
                        application: "oishi1h"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi1v",
                        application: "oishi1v"
                      }, "lat", 0)

    when "2h"
      putOnahamaRouteLog("2", "h")
      @routedb.update({
                        table: "oishi2h",
                        application: "oishi2h"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi2v",
                        application: "oishi2v"
                      }, "lat", -800)
    when "2v"
      putOnahamaRouteLog("2", "v")
      @routedb.update({
                        table: "oishi2h",
                        application: "oishi2h"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi2v",
                        application: "oishi2v"
                      }, "lat", 0)

    when "3h"
      putOnahamaRouteLog("3", "h")
      @routedb.update({
                        table: "oishi3h",
                        application: "oishi3h"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi3v",
                        application: "oishi3v"
                      }, "lat", -800)
    when "3v"
      putOnahamaRouteLog("3", "v")
      @routedb.update({
                        table: "oishi3h",
                        application: "oishi3h"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi3v",
                        application: "oishi3v"
                      }, "lat", 0)

    when "4h"
      putOnahamaRouteLog("4", "h")
      @routedb.update({
                        table: "oishi4h",
                        application: "oishi4h"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi4v",
                        application: "oishi4v"
                      }, "lat", -800)
    when "4v"
      putOnahamaRouteLog("4", "v")
      @routedb.update({
                        table: "oishi4h",
                        application: "oishi4h"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi4v",
                        application: "oishi4v"
                      }, "lat", 0)

    when "5h"
      putOnahamaRouteLog("5", "h")
      @routedb.update({
                        table: "oishi5h",
                        application: "oishi5h"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi5v",
                        application: "oishi5v"
                      }, "lat", -800)
    when "5v"
      putOnahamaRouteLog("5", "v")
      @routedb.update({
                        table: "oishi5h",
                        application: "oishi5h"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi5v",
                        application: "oishi5v"
                      }, "lat", 0)

    when "6h"
      putOnahamaRouteLog("6", "h")
      @routedb.update({
                        table: "oishi6h",
                        application: "oishi6h"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi6v",
                        application: "oishi6v"
                      }, "lat", -800)
    when "6v"
      putOnahamaRouteLog("6", "v")
      @routedb.update({
                        table: "oishi6h",
                        application: "oishi6h"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi6v",
                        application: "oishi6v"
                      }, "lat", 0)

    when "7h"
      putOnahamaRouteLog("7", "h")
      @routedb.update({
                        table: "oishi7h",
                        application: "oishi7h"
                      }, "lat", 0)
      @routedb.update({
                        table: "oishi7v",
                        application: "oishi7v"
                      }, "lat", -800)
    when "7v"
      putOnahamaRouteLog("7", "v")
      @routedb.update({
                        table: "oishi7h",
                        application: "oishi7h"
                      }, "lat", -800)
      @routedb.update({
                        table: "oishi7v",
                        application: "oishi7v"
                      }, "lat", 0)
    end
  end


  # Fukuoka
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

