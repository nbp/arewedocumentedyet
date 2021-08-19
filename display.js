'use strict';

function log(msg) {
  var status = document.getElementById("status");
  status.innerText = msg;
}

function displayResults(errors) {
  var results = [];
  for (var key of Object.keys(errors)) {
    let err = {
      errorMessageName: key,
      category: ""
    };
    results.push({
      key: key || "Unknown Error Key",
      err: errors[key],
      sum: errors[key].data.map((x) => x.sum).reduce((a,b) => a + b, 0),
      mdn: exports.GetURL(err)
    });
  }
  results.sort((a,b) => a.sum < b.sum);
  var errorList = document.getElementById("error-list");
  for (var entry of results) {
    var li = document.createElement("li");
    var pName = document.createElement("span");
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
      var aMdn = document.createElement("a");
      aMdn.appendChild(textName);
      aMdn.setAttribute("href", entry.mdn)
      pName.appendChild(aMdn);
    } else {
      pName.appendChild(textName);
    }
    pSum.classList.add("sum");
    pSum.appendChild(textSum);
    errorList.appendChild(li);
  }
}

function aggregateErrors(...errs) {
  var errors = {};
  for (var err of errs) {
    for (var key of Object.keys(err)) {
      if (!errors[key])
        errors[key] = { data: [] };
      errors[key].data = errors[key].data.concat(err[key].data);
    }
  }
  return errors;
}

const versionJSON = "https://product-details.mozilla.org/1.0/firefox_versions.json";
const metric = "DEVTOOLS_JAVASCRIPT_ERROR_DISPLAYED";

const nightlyChannel = {
  name: "nightly",
  key: "FIREFOX_NIGHTLY"
};

const betaChannel = {
  name: "beta",
  key: "FIREFOX_DEVEDITION"
};

async function fillPageContent() {
  log("Fetch latest version numbers.");
  try {
    var response = await fetch(versionJSON);
    if (!response.ok)
      throw "";
  } catch (e) {
      log("Unable to fetch latest version numbers:" + e);
      return;
  }

  var versions = await response.json();
  var bnum = parseInt(versions[betaChannel.key]);
  var nnum = parseInt(versions[nightlyChannel.key]);
  var bmin = bnum - 5;
  var nmin = nnum - 5;

  log("Initialize telemetry.");
  await (new Promise( (resolve, reject) => Telemetry.init(resolve) ));

  log("Request telemetry data.");
  // Telemetry collection got removed in Bug 1381834, and pending to be added
  // back in Bug 1525682.
  var errs = [];
  for (let bn = bmin; bn < bnum; bn++) {
    errs.push(new Promise(function (resolve, reject) {
        Telemetry.getEvolution(betaChannel.name, "" + bn, metric, {}, true, resolve);
    }));
  }
  for (let nn = nmin; nn < nnum; nn++) {
    errs.push(new Promise(function (resolve, reject) {
        Telemetry.getEvolution(betaChannel.name, "" + nn, metric, {}, true, resolve);
    }));
  }

  for (var i = 0; i < errs.length; i++) {
    try {
      errs[i] = await errs[i];
    } catch {
      errs[i] = {};
    }
  }
  var errors = aggregateErrors(...errs);

  log("Aggregate results.");
  displayResults(errors);

  log("Error hits, and MDN pages:.");
}

fillPageContent();
