const moment = require('moment');

/*
 * Author: Vu Bui
 * Date create: March 23, 2019
 * Author note: This approach is design for accuracy.
 * Timestamp of request was stored for use later,
 * there fore maxReqsPerSecond should be small to get effective memory.
 * 
 * Another approach call "Sliding window counters" is more suitable for production using.
 * https://www.figma.com/blog/an-alternative-approach-to-rate-limiting/
 */

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
  options = Object.assign(defaultOptions, options);

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
    const id = options.requestIdentifier(req);
    options.store = options.store || {};
    options.store[id] = options.store[id] || {
      requests: [],
      isCountdown: false,
    };

    // Renew clear data when time expired ( avoid Memory leak )
    clearTimeout(options.store[id].cleaner);
    options.store[id].cleaner = setTimeout(function(){
      clearTimeout(options.store[id].cleaner);
      delete options.store[id];
    }, options.timeRange);

    // Check if is penalty
    if (options.store[id].isCountdown == true) {
      const now = moment().valueOf();
      const lastReq = moment.unix(options.store[id].requests[0]);
      const countDownDiff = moment.unix(now).diff(lastReq) / 1000;
      if (countDownDiff > options.cooldownTime * 1000) {
        options.store[id].requests = [];
        options.store[id].isCountdown = false;
        clearTimeout(options.store[id].cleaner);
      } else {
        const remainTime = options.cooldownTime * 1000 - countDownDiff;
        return options.handler(req, res, next, options.remainMessageRender(remainTime));
      }
    }

    // Add timestamp to request list
    if (options.store[id].requests.length > options.maxRequest) {
      options.store[id].requests.shift();
    }
    options.store[id].requests.push(moment().valueOf());

    // Check route being flooded
    const totalRequest = options.store[id].requests.length;
    const first = moment.unix(options.store[id].requests[0]);
    const last = moment.unix(options.store[id].requests[totalRequest - 1]);
    const diff = parseInt(last.diff(first)) / 1000;

    if (totalRequest > options.maxRequest && diff < options.timeRange) {
      options.store[id].isCountdown = true;
      return options.handler(req, res, next, options.message);
    }

    next();
  }
  return rateLimit;
}

module.exports = MyFancyRateLimiter;