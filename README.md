# Cloud Run Stay Awake JS
NodeJS implementation of the cold start mitigation proposed by [@guillaumeblaquiere](https://github.com/guillaumeblaquiere) (already implemented in [Go](https://github.com/guillaumeblaquiere/cloudrun-sigterm-selfcall) & [Python](https://github.com/Resousse/cloudrun-stay-awake))

## Purpose
A Cloud Run GCP service stop after an idle period, this time cannot be forseen.
As a result, the next request after the stop, will have a **cold start**, a delay of one or several seconds, Cloud Run takes to start a new container.
One of the cheap solutions proposed by Guillaume (https://medium.com/google-cloud/3-solutions-to-mitigate-the-cold-starts-on-cloud-run-8c60f0ae7894) is to schedule an http call every minute to keep alive the service. However this solution is not accurate as the stop can occurs in less than a minute after the last request. And Cloud Scheduling can't go under a minute.

Another solutions is presented to trigger the stop signal (a SIGTERM signal) to self call the service to try to keep it alive. This is what this code is about.

## How to Use
Easy steps:
- `npm install cloudrun-stay-awake`
- In the main file of your code, that will run a server (such as `app.js`), just put this include directive somewhere in your code : `require('cloudrun-stay-awake')`

## Tests
In case you want to perform some tests before deploying to your code, there is a Dockerfile that can be used to test it on Cloud Run

## License

This library is licensed under Apache 2.0. Full license text is available in
[LICENSE](https://github.com/Resousse/cloudrun-stay-awake/tree/main/LICENSE).