var request = require('request');

var AzureFunction = function(context, req) {
   
    if (req.query.bucket && req.query.environment && req.query.accessToken) {
        
        triggerBucketWebhook(req.query.bucket, req.query.environment)
            .then((data) => {
                data.runs.map((testExecution) => {

                    var token = req.query.accessToken;
                    var testResultUrl = `https://api.runscope.com/buckets/${testExecution.bucket_key}/tests/${testExecution.test_id}/results/${testExecution.test_run_id}`;
                    fetchTestResult(token, testResultUrl).then((result) => {
                        console.log(result);
                    });

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

var triggerBucketWebhook = function(bucket, environment){
    var triggerUrl = "https://api.runscope.com/radar/bucket/" + bucket + "/trigger?runscope_environment=" + environment;
    return new Promise((resolve, reject) => {
            var result = request({
                    url: triggerUrl
                }, 
                function(err, res) {
                    var json = JSON.parse(res.body);
                    console.log("Environemnt --> " + json.data.runs[0].environment_name);
                    resolve(json.data);
                });
        });
}

var fetchTestResult = function(token, testResultUrl) {
    return new Promise(function (resolve, reject) {
        (function getTestResultRecursive(){
            getTestResult(token, testResultUrl)
                .then(function(result) { 
                    console.log("...");
                    if (result != 'working' && result !== 'queued' && result !== undefined) return resolve(result);
                    setTimeout(getTestResultRecursive, 1000);
                });
        })();
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
                    //console.log(json.data.test_run_id);
                    resolve(json.data.result);
                });
        });
}

// Local development request object
var req = {
    originalUrl: 'https://myfunctionurl/bucket/f2b458fd-f626-4ad3-bc55-3cc04bc5c627/environment/b2282a74-7b9f-4bbc-a2b0-f6e68851d174',
    method: 'GET',
    query: {
        "bucket": "f2b458fd-f626-4ad3-bc55-3cc04bc5c627",
        "environment": "b2282a74-7b9f-4bbc-a2b0-f6e68851d174",
        "accessToken" : "fa96481a-3c20-49ec-ae4f-fec9906e309a"
    },
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
