#Config

Gateway somehow needs to know about where the cores exist and under which region. This is done through a configuration environment variable.
The file `/config.json.sample` is an example of the required configuration structure. 

Here are the steps to put the correct value for the parameter `RawConfig` in the CloudFormation Template.

1. Place a `config.json` in the root directory
2. Run  `node scripts/stringify.js` to output a stringified version of the config.
  * OSX Users: `node scripts/stringify.js | pbcopy` will directly copy it to your clipboard
3. Paste the value in the `RawConfig` Cloudformation field 
