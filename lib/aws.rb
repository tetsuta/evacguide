require 'aws-sdk-dynamodb'

class AWSD
  def initialize(table_name)
    client = Aws::DynamoDB::Client.new(region: "ap-northeast-1")
    dynamo_resource = Aws::DynamoDB::Resource.new(client: client)
    @table = dynamo_resource.table(table_name)
  end

  def put(data)
    @table.put_item({item: data})
  end

  def remove(condition)
    delete(condition)
  end

  def delete(condition)
    return @table.delete_item(key: condition)
  end

  def get(condition)
    ret_val = @table.get_item(key: condition)
    return ret_val["item"]
  end

  def get_all_items()
    ret_val = @table.scan()
    return ret_val["items"]
  end
end

