#The decorator @Cacheable(ttl, [tablename])

The Decorator for caching class methods data.

#Install: 
```
npm install cacheable-methods-dynamodb
```



##Documentation: 

@Cacheable is a decorator that caches your methods result in dynamoDb. 
It as 2 arguments :
 - ttl ( the time to leave in Days)
 - (optional) tablename ( the name of the dynamoDb table you wants to use, default is **cache**)

<br/>IN ORDER TO GET THIS WORKING YOUR TABLE HAVE TO HAVE A SINGLE PRIMARY KEY (key-schema) named : **cacheKey**
<br/>Cli declation exemple: **--key-schema AttributeName=cacheKey,KeyType=HASH**

####Usage exemple:

```
@Cacheable(1) // Cache 1 day on default table cache
@Cacheable(7, 'customCacheTable') //Cache 7 day on customCacheTable table
```

## Exemple of implementation: 

```
import Cacheable from 'cacheable-methods-dynamodb';

class TestClass {
  //one Day
  @Cacheable(1)
  public async getUserById(id: string, param: any): Promise<any> {
    return {
        name: "olivier",
        prenom: "andrae"
    };
  }

}
(async ()=>{
    const a = new TestClass();
    console.log(await a.getUserById("12", {o: 2}));
})();
```

##.env variables:
```
LOCAL=true // will connect to http://localhost:8000
DEBUG=false
```

##AWS Credentials

They are taken from yout local setup, usualy ~/.aws folder
