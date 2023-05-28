const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
//const app = express();

const app = express();

class walletRepo {
  constructor() {
    this.counter = 0;
    this.list = [];
  }

  nextId() {
    this.counter += 1;
    return this.counter;
  }

  add(wallet) {
    wallet.wallet_id = this.nextId();
    console.log(wallet);
    this.list.push(wallet);
    return wallet;
  }

  find(wallet_id) {
    const index = this.list.findIndex(wallet => wallet.wallet_id === wallet_id);
    return this.list[index];
  } 

  update(walletUpdated) {
    const index = this.list.findIndex(wallet => wallet.wallet_id === walletUpdated.wallet_id);
    this.list[index] = walletUpdated;
  }
}

class Wallet {
  constructor(publicKey, wallet_id) {
    this.wallet_id = wallet_id;
    this.publicKey = publicKey;
  } 

  static CreateNewWallet(repo, publicKey) {
    const wallet = new Wallet(publicKey);
    return repo.add(wallet);
  }
}

const repo = new walletRepo();
const keyPair = ec.genKeyPair();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.put('/wallets', (req, res) => {
  let params  = req.body;
  const wallet = Wallet.CreateNewWallet(repo, params.wallet_public_key);
  return res.json(wallet);
});


app.get('/wallets/:id', (req, res) => {
    const wallet_id = req.params.id;
    const wallet = repo.find(wallet_id);
    res.json(wallet);
});

app.get('/public_keys', (req, res) => {
  const publicKey = keyPair.getPublic('hex');
  res.json({public_key: [publicKey]});  
})

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});




