'use strict';

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
