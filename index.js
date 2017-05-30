var request = require('request');

var AzureFunction = function(context, req) {

    if (req.query.bucket && req.query.environment && req.query.accessToken) {
        
        start(req.query.bucket, req.query.environment, req.query.accessToken)
            .then(() => {
                console.log('ALL GOOD!');
            })
            .catch((err) => {
                console.log('SOMETHING WENT WRONG: ' + err);
            });

        context.res = {
            status: 200,
            body: req.query.runscope_environment
        };
    }
    else {
        context.res = {
            status: 400,
            body: "missing required parameters (bucket, environment and accessToken)"
        };
    }
    context.done();
};

var start = function(bucket, environment, accessToken){

    return new Promise((resolve, reject) => {
        triggerBucketWebhook(bucket, environment)
                .then((data) => {
                    data.runs.map((testExecution) => {

                        var token = accessToken;
                        var testResultUrl = `https://api.runscope.com/buckets/${testExecution.bucket_key}/tests/${testExecution.test_id}/results/${testExecution.test_run_id}`;
                        fetchTestResult(token, testResultUrl)
                            .then((result) => {
                                console.log(result);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    });
            }).catch((err) => {
                reject(err);      
            });
        });
}

var triggerBucketWebhook = function(bucket, environment){
    var triggerUrl = `https://api.runscope.com/radar/bucket/${bucket}/trigger?runscope_environment=${environment}`;
    return new Promise((resolve, reject) => {
            var result = request({
                    url: triggerUrl
                }, 
                function(err, res) {
                    if (err != null) reject(err);
                    var json = JSON.parse(res.body);
                    console.log("Environemnt --> " + json.data.runs[0].environment_name);
                    resolve(json.data);
                });
        });
}

var fetchTestResult = function(token, testResultUrl) {
    return new Promise(function (resolve, reject) {
        (function getExecutionResultRecursive(){
            getExecutionResult(token, testResultUrl)
                .then(function(result) { 
                    console.log("...");
                    if (result == 'fail') return reject('at least one test is failing');
                    if (result != 'working' && result !== 'queued' && result !== undefined) return resolve(result);
                    setTimeout(getExecutionResultRecursive, 1000);
                });
        })();
    });
}

var getExecutionResult = function(token, url){   
    return new Promise((resolve, reject) => {
        var result = request({
                url: url,
                auth: { 'bearer': token }
            }, 
            function(err, res) {
                if (err != null) reject(err);
                var json = JSON.parse(res.body);
                resolve(json.data.result);
            });
        });
}

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
        console.log('Starting Azure Function...');
    },
    res: null
};

AzureFunction(debugContext, req);
