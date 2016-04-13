#Setup Documentation [WIP]

Most of `servo-gateway` is deployed via a Cloud Formation Template under `/scripts`, however this will walk through some of the additional setup required beforehand. The reason it is deployed this way, is because no single instance of `servo-core` should be aware of `servo-gateway` since `servo-gateway` can serve multiple cores within the same region.

## Before you deploy:
* Know the url from which you would like to host `servo-gateway`
* Obtain an Signed Cert that verifies that domain.

## How to
1. [Server Certificates] (Certs.md)
2. [Route53 Entry] (Route53.md)
3. [DynamoDB Tables] (DynamoDB.md)
4. [Git Deploy Keys] (Deploy.md)
5. [Config] (Config.md)
