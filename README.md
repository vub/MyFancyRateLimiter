# NodeJS Developer assignment

### Task
Write a simple NodeJS RateLimiter middleware

### Description
This middleware helps protect a route from being flooded.
For example, if there are more than 10 requests / second to an endpoint, it should output 429 - too many requests.

An example usage:

    app.use('/create-user', `MyFancyRateLimiter`({maxReqsPerSecond: 10}), (req, res) {
        ... actual create user in database ...
    })

This would mean that if there are more than 10 rps, the endpoint will respond with 429 immediately

### Requirements
*MyFancyRateLimiter* can accept many options:
- cooldownTime

> Default: 15.

> After reaching 429, subsequent requests must wait 15 seconds. During that duration, 429 is the expected output. Also during that period, you must set a header X-remaining-cooldown to the number of seconds remaining before making another request

- maxReqsPerSecond

> Default: 10

> This is the number of maximum request per second that this endpoint can accept, can be decimal, so 0.5 means that an endpoint only accept 1 request every 2 seconds

- requestIdentifier:

> Default: (req) => ''

> This function accepts `req` object and outputs the key of the request. Eg: if `requestIdentifier` is set to `(req) => request.connection.remoteAddress`, this means that the rate limiter only activates for requests coming from the same client IP address.