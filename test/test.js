const Promise = require("./Promise");
const promisesAplusTests = require("promises-aplus-tests");

let adapter = {
  deferred: function () {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });
    return dfd;
  },
};
promisesAplusTests(adapter);
