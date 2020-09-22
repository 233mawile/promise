const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

const { queueTask, isFunction, isObjectExceptNull } = require("./utils");

function initPromiseProps(promise) {
  Object.defineProperties(promise, {
    state: {
      value: PENDING,
      writable: true,
      enumerable: true,
    },
    value: {
      value: undefined,
      writable: true,
      enumerable: true,
    },
    reason: {
      value: undefined,
      writable: true,
      enumerable: true,
    },
    onfulfilledList: {
      value: [],
    },
    onrejectedList: {
      value: [],
    },
  });
}

function Promise(executor) {
  initPromiseProps(this);

  const resolve = (x) => {
    if (this.state !== PENDING) return;
    if (x === this) return reject(new TypeError("x === promise"));
    if (x instanceof Promise) {
      x.then(
        (v) => resolve(v),
        (e) => reject(e)
      );
      return;
    }
    if (isObjectExceptNull(x) || isFunction(x)) {
      let then;
      try {
        then = x.then;
      } catch (e) {
        return reject(e);
      }
      if (typeof then === "function") {
        let called = false;
        try {
          then.call(
            x,
            (v) => {
              if (called) return;
              called = true;
              resolve(v);
            },
            (e) => {
              if (called) return;
              called = true;
              reject(e);
            }
          );
          return;
        } catch (e) {
          if (called) return;
          called = true;
          return reject(e);
        }
      }
    }
    resolveNormalValue(x);
  };

  const resolveNormalValue = (value) => {
    this.value = value;
    this.state = FULFILLED;
    queueTask(() => {
      this.onfulfilledList.forEach((onfulfilled) => {
        onfulfilled(value);
      });
    });
  };

  const reject = (error) => {
    if (this.state !== PENDING) return;
    this.reason = error;
    this.state = REJECTED;
    queueTask(() => {
      this.onrejectedList.forEach((onrejected) => {
        onrejected(error);
      });
    });
  };

  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

Promise.prototype.then = then;
Promise.prototype.catch = function (onrejected) {
  then.call(this, undefined, onrejected);
};

function then(onfulfilled, onrejected) {
  const pc = createPromiseController();

  const fulfilledHandle = (value) => {
    let nextResult;
    try {
      nextResult = isFunction(onfulfilled) ? onfulfilled(value) : value;
    } catch (e) {
      return pc.reject(e);
    }
    pc.resolve(nextResult);
  };

  const rejectedHandle = (reason) => {
    if (isFunction(onrejected)) {
      try {
        let nextResult = onrejected(reason);
        pc.resolve(nextResult);
      } catch (e) {
        pc.reject(e);
      }
    } else {
      pc.reject(reason);
    }
  };

  switch (this.state) {
    case PENDING:
      this.onfulfilledList.push(fulfilledHandle);
      this.onrejectedList.push(rejectedHandle);
      break;
    case FULFILLED:
      queueTask(() => fulfilledHandle(this.value));
      break;
    case REJECTED:
      queueTask(() => rejectedHandle(this.reason));
      break;
    default:
      break;
  }
  return pc.promise;
}

function createPromiseController() {
  let resolve, reject;
  const promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
}

module.exports = Promise;
