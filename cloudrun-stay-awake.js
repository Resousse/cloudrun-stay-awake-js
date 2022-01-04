const https = require('https');
const http = require('http');


(function () {
    process.once('SIGTERM', function (code) {
        stayAwake(code);
      });
})();


var stayAwake =  function (code) {
    console.log("Attempt to keep the service alive : signal n°"+code+" received");
    getCloudRunProjectId();
  };


var getCloudRunProjectId = function() {
    const options = {
        hostname: 'metadata.google.internal',
        path: '/computeMetadata/v1/project/project-id',
        headers: { 'Metadata-Flavor': 'Google' }
      };
    http.get(options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        //console.log("ProjectID " + data);
        getCloudRunRegion(data)
    });

    }).on("error", (err) => {
    console.log("Error: " + err.message);
    });
    };

var getCloudRunRegion = function(projectId) {
        const options = {
            hostname: 'metadata.google.internal',
            path: '/computeMetadata/v1/instance/region',
            headers: { 'Metadata-Flavor': 'Google' }
          };
        http.get(options, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            var region = "";
            var params = data.split("/");
            if (params.length <= 4)
                region = params[3]
            //console.log("Region " + region);
            getCloudRunAccessToken(projectId, region);
        });
    
        }).on("error", (err) => {
        console.log("Error: " + err.message);
        });
        };

var getCloudRunAccessToken = function (projectId, region)
{
    var service = process.env.K_SERVICE || false;
    if (!service)
    {
        console.log("No K_SERVICE env variable found");
        return;
    }
    var hostname = region+'-run.googleapis.com';
    var path = "/apis/serving.knative.dev/v1/namespaces/"+projectId+"/services/"+service;
    const options = {
        hostname: "metadata.google.internal",
        path: "/computeMetadata/v1/instance/service-accounts/default/token?scopes=https://www.googleapis.com/auth/cloud-platform",
        headers: { 'Metadata-Flavor': 'Google' }
      };
    http.get(options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        var jsbody = JSON.parse(data);
        //console.log("Access Token retrieved");
        getCloudRunPublicUrl(hostname, path, jsbody.access_token);
    });

    }).on("error", (err) => {
    console.log("Error: " + err.message);
    });
};

var getCloudRunPublicUrl = function (hostname, path, token){
    const options = {
        hostname: hostname,
        path: path,
        headers: { 'Authorization': 'Bearer '+token, "User-Agent": 'Clour Run Stay Awake/1.0'}
      };
    https.get(options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        var jsbody = JSON.parse(data);
        if ("status" in jsbody && "url" in jsbody.status)
        {
            //console.log("Public URL "+jsbody.status.url);
            getCloudRunIdentityToken(jsbody.status.url)
        }
        else
        { 
            console.log("Public URL not found in metadata");
        }
    });

    }).on("error", (err) => {
    console.log("Error: " + err.message);
    });
};

var getCloudRunIdentityToken = function (url)
{
    const options = {
        hostname: "metadata",
        path: "/computeMetadata/v1/instance/service-accounts/default/identity?audience="+url,
        headers: { 'Metadata-Flavor': 'Google' }
      };
    http.get(options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        //console.log("Identity Token retrieved");
        selfCallCloudRun(url, data);
    });

    }).on("error", (err) => {
    console.log("Error: " + err.message);
    });
};

var selfCallCloudRun = function(url, IdToken)
{   var targeturl = url.match(/(https?:\/\/)?([^:\/\\]+):?(\d*)(\/?.*)$/);
    var portcall = 0
    if (targeturl[3] != "")
      portcall = targeturl[3];
    else if (targeturl[1] == "https://")
      portcall = 443;
    const options = {
        hostname: targeturl[2],
        port: portcall,
        path: targeturl[4] || '/',
        headers: { 'Authorization': 'Bearer '+IdToken, 'User-Agent': 'CloudRunStayAwake/1.0' }
      };
    https.get(options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        console.log("Self Call successful, cold start minimized");
    });

    }).on("error", (err) => {
    console.log("Unable to do the Self Call: " + err.message);
    });
};