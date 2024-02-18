# coding: utf-8
require 'aws-sdk-dynamodb'

class AWSD
  def initialize(table_name, region)
    client = Aws::DynamoDB::Client.new(region: region)
    dynamo_resource = Aws::DynamoDB::Resource.new(client: client)
    @table = dynamo_resource.table(table_name)
  end

  # data: hash of item
  def put(data)
    @table.put_item({item: data})
  end

  # conditionに該当するレコードの、targetを valueで更新する
  # condition: hash
  # target: string
  # value: any class
  def update(condition, target, value)
    @table.update_item(
      key: condition,
      update_expression: "SET #{target} = :ok",
      expression_attribute_values: {":ok" => value}
    )
  end


  # call delete
  def remove(condition)
    delete(condition)
  end

  # condition: hash to specify an item
  def delete(condition)
    return @table.delete_item(key: condition)
  end

  # condition: hash to specify an item
  def get(condition)
    ret_val = @table.get_item(key: condition)
    return ret_val["item"]
  end


  # condition: hash to specify an item
  def get_cond_items(cond)
    cond_key = cond.keys[0]
    cond_value = cond[cond_key]

    ret_items = []
    ret_val = @table.scan(
      filter_expression: "begins_with(#{cond_key}, :#{cond_key})",
      expression_attribute_values:  {":#{cond_key}" => cond_value}
    )
    # p ret_val["items"].size
    # p ret_val["last_evaluated_key"]
    ret_items += ret_val["items"]

    while ret_val["last_evaluated_key"] != nil
      # puts "---"
      ret_val = @table.scan(
        filter_expression: "begins_with(#{cond_key}, :#{cond_key})",
        expression_attribute_values:  {":#{cond_key}" => cond_value},
        exclusive_start_key: ret_val["last_evaluated_key"]
      )
      # p ret_val["items"].size
      # p ret_val["last_evaluated_key"]
      ret_items += ret_val["items"]
    end

    puts "get_cond_items"
    puts ret_items.size

    return ret_items
  end


  def get_all_items()
    ret_items = []

    ret_val = @table.scan()
    ret_items += ret_val["items"]

    while ret_val["last_evaluated_key"] != nil
      ret_val = @table.scan(
        exclusive_start_key: ret_val["last_evaluated_key"]
      )
      ret_items += ret_val["items"]
    end

    puts "get_all_items"
    puts ret_items.size

    return ret_items
  end


  def get_sorted_all_items()
    ret_val = get_all_items()

    ### DBがきれいになったら filterを消す
    sorted_list = ret_val.filter{|r| r["table"] !~ /[AP]M/}.sort{|a,b|
      Time.parse(a["table"]) <=> Time.parse(b["table"])
    }
    return sorted_list
  end

end

