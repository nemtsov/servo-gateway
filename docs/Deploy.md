#Deploy

In order to deploy `servo-gateway` using the cloudformation template, you need to create a github SSH key that has access to the repo. This way, the repo could be private and still allow deploys.

For [this Github tutorial] (https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/) to configure SSH keys for your account. The private key will be a parameter for the CFN template. 

1 The CloudFormation Template accepts the GitDeployKey as a Comma Delimited Value, so replace every new line character with a comma (`,`). 
  * This command will quickly replace all new lines with commas: `cat gateway_deploy_key.pem | tr "\n" ","`
  * For OSX users, you can pipe it directly to your clipboard: `cat gateway_deploy_key.pem | tr "\n" "," | pbcopy`
  * **__NOTE__**: This places an extra `,` at the end of the string. Remember to strip this out!
