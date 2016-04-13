#DynamoDB Setup

All permissions and users are managed within DynamoDB.

Currently all information is stored in the `us-east-1` region. Here are the three tables that should be created before attempting to launch gateway (This will be automated in the future):
* servo-users
* servo-permissions
* servo-user-access-tokens

## Table Schema

### servo-users
| Key        | Type       | Info          |
|------------|------------|---------------|
| username   | String     | **HashKey**   |
| name       | String     |               |
| password   | String     | Hashed password      |
| key        | String     | MFA key (added after first login)      |


### servo-permissions
| Key        | Type       | Info          |
|------------|------------|---------------|
| username   | String     | **HashKey**   |
| context    | String     | **RangeKey**            |
| userrole   | String     | `user`\| `member`|\`owner`      |


### servo-user-access-tokens
| Key          | Type       | Info          |
|------------|------------|---------------|
| username     | String     | **HashKey**   |
| tokenname    | String     | **RangeKey**  |
| accesstoken  | String     |               |
| secret       | String     |               |
