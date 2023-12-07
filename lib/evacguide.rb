# coding: utf-8
require 'json'

class EVACGUIDE
  def initialize()
    @cross_list = []
  end

  def get_reports()
    report_list = []
    report_list.push({
                       timestamp: Time.new(2023,12,3,10,3,0),
                       img: 'https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1',
                       lat: 36.94891755154147,
                       lng: 140.90274810791018
                     })
    report_list.push({
                       timestamp: Time.new(2023,12,3,10,4,0),
                       img: 'https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1',
                       lat: 36.94812872265479,
                       lng: 140.90515136718753
                     })
    report_list.push({
                       timestamp: Time.new(2023,12,3,10,5,0),
                       img: 'https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1',
                       lat: 36.947511372610805,
                       lng: 140.90772628784183
                     })
    return report_list
  end


  def put_cross(lat, lng)
    @cross_list.push({
                      lat: lat,
                      lng: lng
                    })

    return cross_table()
  end


  def close()
  end

  :private
  def cross_table()
    buffer = ""
    @cross_list.each{|cross|
      buffer << "#{cross.lat}, #{cross.lng} <br>\n"
    }
    return buffer
  end

end

eg = EVACGUIDE.new()
p eg.get_reports()



# mg.put_cross(36.957683077113025, 140.9071254730225)


