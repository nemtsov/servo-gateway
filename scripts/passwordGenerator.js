var passwordHash = require('password-hash'),
  crypto = require('crypto');

function random() {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      rnd = crypto.randomBytes(10),
      value = new Array(10),
      len = possible.length;

    for (var i = 0; i < 10; i++) {
        value[i] = possible[rnd[i] % len]
    };

    return value.join('');
}

function generatePassword(){
  var plaintext = random();
  return {
    plaintext: plaintext,
    hash: passwordHash.generate(plaintext)
  }
}

if (!module.parent) {
    var password = generatePassword();
    console.log('password:', password.plaintext);
    console.log('hash:', password.hash);
}

module.exports = generatePassword;
