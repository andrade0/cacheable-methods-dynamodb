import { CacheClient } from '../interfaces';
import moment = require("moment");
import {DiggingDynamodbClient, DiggingDynamodbClientInterface} from "dynamodb-repository";

class TableKey{
  cacheKey: string = '';
}

interface CacheItemInterface {
  cacheKey: string;
  expire: string;
  value: any;
}

class CacheItem implements CacheItemInterface{
  cacheKey: string = '';
  expire: string = '';
  value: any;
}

class CacheRepository extends DiggingDynamodbClient<CacheItem, TableKey> {
  constructor(
    public TableName = 'cache',
    public classType = CacheItem,
  ) {
    super(TableName);
  }
}

const CacheRepositoryInstance = new CacheRepository();

class DynamoDbAdapter implements CacheClient {
  public tableName: string = 'cache';
  private dynamoDbClient: DiggingDynamodbClientInterface<CacheItem, TableKey> = CacheRepositoryInstance;
  public setTableName(tableName: string = 'cache'){
    this.tableName = tableName;
    this.dynamoDbClient.TableName = this.tableName;
  }
  public async get(cacheKey: string): Promise<CacheItem | null> {
    try{
      const cacheItem: CacheItemInterface = await this.dynamoDbClient.findOne({"cacheKey": cacheKey});
      if(cacheItem){
        if (moment(cacheItem.expire).isSameOrAfter(moment())) { //le cache est à jour
          return cacheItem.value;
        } else {
          await this.del(cacheKey);
          return null;
        }
      } else {
        return null;
      }
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  /**
   * set - Sets a key equal to a value in a AWS.DynamoDB.DocumentClient cache
   *
   * @param cacheKey The key to store the value under
   * @param value    The value to store
   * @param ttl      Time to Live (how long, in seconds, the value should be cached)
   *
   * @returns {Promise}
   */
  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    const expire = moment().add(ttl, 'days').toDate().toISOString();
    const item = new CacheItem();
    item.cacheKey = cacheKey;
    item.value = value;
    item.expire = expire;
    try {
      await this.dynamoDbClient.insertOne(item);
    } catch (err) {
      throw new Error("Unable to add item. Error JSON: "+err.message);
    }
  }

  public async del(cacheKey: string): Promise<any> {
    var params = {
      TableName: 'DiscogsCacheModule',
      Key:{
        "cacheKey": cacheKey
      }
    };
    return await this.dynamoDbClient.deleteOne({"cacheKey": cacheKey}, "cacheKey=:cacheKey", {':cacheKey': cacheKey});
  }

}

const DynamoDbAdapterInstance = new DynamoDbAdapter();

export { DynamoDbAdapter, DynamoDbAdapterInstance };

