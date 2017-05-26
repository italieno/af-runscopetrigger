var request = require('request');
 

var AzureFunction = function(context, req) {
   
    if (req.query.bucket && req.query.environment) {
        
        //req.body.data.runs.map(testResult);
        triggerBucketTest(req.query.bucket, req.query.environment)
            .then((data) => {
                getToken()
                    .then((token) => {
                        setTimeout(function(){
                            data.runs.map((x) => testResult(token, x));
                        }, 10000);
                });
        }).catch(function(e){
            console,log('error!!!', e)        
        });;

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: req.query.runscope_environment
        };
    }
    else {
        context.res = {
            status: 400,
            body: "At Least one test is failing..."
        };
    }
    context.done();
};


var testResult = function(token, test){

    
    var testResultUrl = "https://api.runscope.com/buckets/" + test.bucket_key + "/tests/" + test.test_id + "/results/" + test.test_run_id;
    
    getTestResult(token, testResultUrl).then((result) => {

        var testWasSuccessfull = result == 'pass';
        if (testWasSuccessfull){
            console.log('ok');
        }
        else{
            throw ('test is failing');
        }
                    
        
    })
    
}

var triggerBucketTest = function(bucket, environment){

    var triggerUrl = "https://api.runscope.com/radar/bucket/" + bucket + "/trigger?runscope_environment=" + environment;

    return new Promise((resolve, reject) => {

            var result = request({
                    url: triggerUrl
                }, 
                function(err, res) {
                    var json = JSON.parse(res.body);
                    resolve(json.data);
                });
        });

}

var getTestResult = function(token, url){
    
    return new Promise((resolve, reject) => {

            var result = request({
                    url: url,
                    auth: {
                        'bearer': token
                    }
                }, 
                function(err, res) {
                    var json = JSON.parse(res.body);
                    resolve(json.data.result);
                });
        });
}

var getToken = function(cb){
    
        return new Promise((resolve, reject) => {

            var result = request({
                    url: 'https://www.runscope.com/signin/oauth/access_token',
                    method: 'POST',
                    form: {
                        'grant_type': 'authorization_code',
                        'client_id': '4de250fe-6157-4361-97eb-13998efba45f',
                        'client_secret': 'e8c896f6-15ad-4e13-a469-f5b68931be03',
                        'code': 'd43419d3-80f7-4257-8f54-82425e9fb7f9'
                    }
                }, 
                function(err, res) {
                    
                        var json = JSON.parse(res.body);
                        resolve(json.access_token);
                    
                });
        });
}


// Local development query and body params
var debugQuery = {
    "bucket": "f2b458fd-f626-4ad3-bc55-3cc04bc5c627",
    "environment": "b2282a74-7b9f-4bbc-a2b0-f6e68851d174",
}

// Local development request object
var req = {
    originalUrl: 'https://myfunctionurl/bucket/f2b458fd-f626-4ad3-bc55-3cc04bc5c627/environment/b2282a74-7b9f-4bbc-a2b0-f6e68851d174',
    method: 'GET',
    query: debugQuery,
    headers: { 
        connection: 'Keep-Alive',
        accept: 'application/json',
        host: 'original-azure-function-url',
        origin: 'https://myfunctionurl/runscope_environment/b2282a74-7b9f-4bbc-a2b0-f6e68851d174',
    },
    body: null,
    rawBody: null
};

// Local development context
var debugContext = {
    invocationId: 'ID',
    bindings: {
        req
    },
    log: function () {
        var util = require('util');
        var val = util.format.apply(null, arguments);
        console.log(val);
    },
    done: function () {
        // When done is called, it will log the response to the console
        console.log('Starting Azure Function...');
    },
    res: null
};

// Call the AzureFunction locally with your testing params
AzureFunction(debugContext, req);
