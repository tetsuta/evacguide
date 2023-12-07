# coding: utf-8
require 'json'
require_relative 'aws'

class EVACGUIDE
  def initialize()
    @reportdb = AWSD.new("eg_report")
    @crossdb = AWSD.new("eg_cross")

    @report_list = []
    @cross_list = []

    @sent_report_id_list = []
    @cross_index = 0
  end


  def getAllInfo()
    @report_list = @reportdb.get_all_items
    @cross_list = @crossdb.get_all_items
    data = {
      "reports" => @report_list,
      "crosses" => @cross_list
    }

    @sent_report_id_list = []
    @report_list.each{|report|
      @sent_report_id_list.push(report["id"])
    }

    id_list = []
    @cross_list.each{|cross|
      if cross["id"] =~ /([0-9]+)/
        id_list.push($1.to_i)
      end
    }
    @cross_index = id_list.max + 1

    return data
  end


  def getUpdateReport()
    update_report_list = []
    @report_list = @reportdb.get_all_items
    @report_list.each{|report|
      if @sent_report_id_list.index(report["id"]) == nil
        update_report_list.push(report)
        @sent_report_id_list.push(report["id"])
      end
    }

    return update_report_list
  end


  def putCross(lat, lng)
    id = "c#{@cross_index}"
    @cross_index += 1

    data = {
      id: id,
      lat: lat,
      lng: lng
    }

    @cross_list.push(data)
    @crossdb.put(data)
    return cross_table()
  end


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
  def cross_table()
    buffer = ""
    @cross_list.each{|cross|
      buffer << "#{cross["id"]}, #{cross["lat"]}, #{cross["lng"]} <br>\n"
    }
    return buffer
  end

end

