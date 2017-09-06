'use strict';

function log(msg) {
  var status = document.getElementById("status");
  status.innerText = msg;
}

function displayResults(errors) {
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

  log("Initialize telemetry.");
  await (new Promise( (resolve, reject) => Telemetry.init(resolve) ));

  log("Request telemetry data.");
  var berr_n0 = (new Promise(function (resolve, reject) {
    Telemetry.getEvolution(betaChannel.name, "" + bnum, metric, {}, true, resolve)
  }));
  var berr_n1 = (new Promise(function (resolve, reject) {
    Telemetry.getEvolution(betaChannel.name, "" + (bnum - 1), metric, {}, true, resolve)
  }));
  var berr_n2 = (new Promise(function (resolve, reject) {
    Telemetry.getEvolution(betaChannel.name, "" + (bnum - 2), metric, {}, true, resolve)
  }));

  var nerr_n0 = (new Promise(function (resolve, reject) {
    Telemetry.getEvolution(nightlyChannel.name, "" + nnum, metric, {}, true, resolve)
  }));
  var nerr_n1 = (new Promise(function (resolve, reject) {
    Telemetry.getEvolution(nightlyChannel.name, "" + (nnum - 1), metric, {}, true, resolve)
  }));
  var nerr_n2 = (new Promise(function (resolve, reject) {
    Telemetry.getEvolution(nightlyChannel.name, "" + (nnum - 2), metric, {}, true, resolve)
  }));

  var errors = aggregateErrors(
    await berr_n0, await berr_n1, await berr_n2,
    await nerr_n0, await nerr_n1, await nerr_n2
  );

  log("Aggregate results.");
  displayResults(errors);

  log("Error hits, and MDN pages:.");
}

fillPageContent();
