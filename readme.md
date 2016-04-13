#Servo Gateway

##The Permission Handler
Servo gateway is the permission layer in PaaS. It handles authentication and sits between the console and core. The VPCs are configured such that only gateway has connectivity to the core. This way, there is no bypassing of the authentication system.

## [AWS Setup Documentation](docs/README.md)

## Setup local development environment

Like local dev for `servo-core`, it will need the following credentials to access AWS resources:
 * `AWS_ACCESS_KEY_ID`
 * `AWS_SECRET_ACCESS_KEY`

In addition, it'll need the following env variables that match those input into the CloudFormation Template:
* `TOKEN_SECRET`
* `RAW_CONFIG`
  * Stringified version of the `config.json`. This can be obtained by running `node scripts/stringify.js`

## [Contributors](https://github.com/dowjones/servo-docs/blob/master/Contributors.md)

## Related Repos
* [servo-docs](http://github.com/dowjones/servo-docs/)
* [servo-core](http://github.com/dowjones/servo-core/)
* [servo-gateway](http://github.com/dowjones/servo-gateway/)

## License
[MIT](LICENSE)
