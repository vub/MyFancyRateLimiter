const moment = require('moment');

function MyFancyRateLimiter(options) {
  // Add more default options
  const defaultOptions = {
    statusCode: 429,
    message: 'Too Many Requests!',
    handler: function (req, res, next, message) {
      res.status(options.statusCode).send(message);
    },
    remainMessageRender: function (time) {
      return 'Access able after ' + time + ' milliseconds';
    }
  }
  options = Object.assign(options, defaultOptions);

  // Refine input information
  if (options.maxReqsPerSecond >= 1) {
    options.maxRequest = options.maxReqsPerSecond;
    options.timeRange = 1000;
  } else {
    options.maxRequest = 1;
    options.timeRange = 1 / options.maxReqsPerSecond * 1000;
  }

  function rateLimit(req, res, next) {
    // Store is saving request timestamp for each id
    var id = options.requestIdentifier(req);
    options.store = options.store || {};
    options.store[id] = options.store[id] || {
      requests: [],
      isCountdown: false,
    };

    // Check if is penalty
    if (options.store[id].isCountdown == true) {
      var now = moment().valueOf();
      var lastReq = moment.unix(options.store[id].requests[0]);
      var countDownDiff = moment.unix(now).diff(lastReq) / 1000;
      if (countDownDiff > options.cooldownTime * 1000) {
        options.store[id].requests = [];
        options.store[id].isCountdown = false;
      } else {
        var remainTime = options.cooldownTime * 1000 - countDownDiff;
        return options.handler(req, res, next, options.remainMessageRender(remainTime));
      }
    }

    // Add timestamp to request list
    if (options.store[id].requests.length > options.maxRequest) {
      options.store[id].requests.shift();
    }
    options.store[id].requests.push(moment().valueOf());

    // Check route being flooded
    var totalRequest = options.store[id].requests.length;
    var first = moment.unix(options.store[id].requests[0]);
    var last = moment.unix(options.store[id].requests[totalRequest - 1]);
    var diff = parseInt(last.diff(first)) / 1000;

    if (totalRequest > options.maxRequest && diff < options.timeRange) {
      options.store[id].isCountdown = true;
      return options.handler(req, res, next, options.message);
    }

    next();
  }
  return rateLimit;
}

module.exports = MyFancyRateLimiter;