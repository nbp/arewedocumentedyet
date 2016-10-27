
'use strict';

// Taken from MDN https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
// A-> $http function is implemented in order to follow the standard Adapter pattern
function $http(url){
 
  // A small example of object
  var core = {

    // Method that performs the ajax request
    ajax: function (method, url, args) {

      // Creating a promise
      var promise = new Promise( function (resolve, reject) {

        // Instantiates the XMLHttpRequest
        var client = new XMLHttpRequest();
        var uri = url;

        if (args && (method === 'POST' || method === 'PUT')) {
          uri += '?';
          var argcount = 0;
          for (var key in args) {
            if (args.hasOwnProperty(key)) {
              if (argcount++) {
                uri += '&';
              }
              uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
            }
          }
        }

        client.open(method, uri);
        client.send();

        client.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            // Performs the function "resolve" when this.status is equal to 2xx
            resolve(this.response);
          } else {
            // Performs the function "reject" when this.status is different than 2xx
            reject(this.statusText);
          }
        };
        client.onerror = function () {
          reject(this.statusText);
        };
      });

      // Return the promise
      return promise;
    }
  };

  // Adapter pattern
  return {
    'get': function(args) {
      return core.ajax('GET', url, args);
    },
    'post': function(args) {
      return core.ajax('POST', url, args);
    },
    'put': function(args) {
      return core.ajax('PUT', url, args);
    },
    'delete': function(args) {
      return core.ajax('DELETE', url, args);
    }
  };
};

Telemetry.init(function() {
  Telemetry.getEvolution("aurora", "51", "DEVTOOLS_JAVASCRIPT_ERROR_DISPLAYED", {}, true, function(errors) {
    var results = [];
    for (var key of Object.keys(errors)) {
      results.push({
        key: key || "Unknown Error Key",
        err: errors[key],
        sum: errors[key].data.map((x) => x.sum).reduce((a,b) => a + b, 0),
        mdn: key in ErrorDocs ? baseURL + ErrorDocs[key] + params : ""
      });
    }
    results.sort((a,b) => a.sum < b.sum);
    console.log("DEVTOOLS_JAVASCRIPT_ERROR_DISPLAYED:\n" + results.map((x) => x.key + " " + x.sum).join("\n"));
    var errorList = document.getElementById("error-list");
    for (var entry of results) {
      var li = document.createElement("li");
      var pName = document.createElement("span");
      var aMdn = document.createElement("a");
      var textName = document.createTextNode(entry.key);
      var pSum = document.createElement("span");
      var textSum = document.createTextNode("" + entry.sum);
      li.classList.add("entry");
      li.id = entry.key;
      li.appendChild(pSum);
      li.appendChild(document.createTextNode(" "));
      li.appendChild(pName);
      pName.classList.add("name");
      if (entry.mdn) {
        pName.appendChild(aMdn);
        aMdn.appendChild(textName);
        aMdn.setAttribute("href", entry.mdn)
      } else {
        pName.appendChild(textName);
      }
      pSum.classList.add("sum");
      pSum.appendChild(textSum);
      errorList.appendChild(li);
    }
  });
});
