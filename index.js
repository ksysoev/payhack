const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // Use the secp256k1 curve

class Ledger {
    constructor(user_id) {
      this.transactions = [];
      this.balance = 0;

      this.userid = user_id;
    }

    addTransaction(tx) {
        if (tx.amountFor(this.userid) + this.balance < 0) {
            throw "Not enough money";
        }

        this.transactions.push(tx);
        this.balance += tx.amountFor(this.userid);
    }
  
    getTransactions() {
      return this.transactions;
    }

    getLastTransaction() {
        return this.transactions[this.transactions.length - 1];
    }
  
    getBalance() {
      return this.balance;
    }

    toString() {
        let str = "";
        for (let i = 0; i < this.transactions.length; i++) {
            str += this.transactions[i].toString() + "\n";
        }

        return str;
    }

    fromString(str) {
        let txs = str.split("\n");

        for (let i = 0; i < txs.length; i++) {
            let tx = new Transaction();
            tx.parse(txs[i]);
            this.addTransaction(tx);
        }
    }

    topUp(amount) {
        let tx = new Transaction(this.transactions.length, 0, this.userid, amount, 0, 0);
        tx.signReciver(reciverKeys);
        this.addTransaction(tx);
    }
  }


 class Transaction {
    constructor(id, from, to, amount, lasttx_sender, lasttx_reciver) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.lasttx_sender = lasttx_sender;
        this.lasttx_reciver = lasttx_reciver;
    }

    baseString() {
        return this.id + "|" + this.from + "|" + this.to + "|" + this.amount + "|" + this.lasttx_sender + "|" + this.lasttx_reciver;
    }

    toString() {
        if (this.reciverSign != null && this.senderSign != null) {
            return this.baseString() + "|" + this.senderSign +  "|" + this.reciverSign;
        }

        if (this.senderSign != null) {
            return this.baseString() + "|" + this.senderSign;
        }

        return this.baseString();
    }

    parse(txstr) {
        let tx = txstr.split("|");

        this.id = tx[0];
        this.from = tx[1];
        this.to = tx[2];
        this.amount = tx[3];
        this.lasttx_sender = tx[4];
        this.lasttx_reciver = tx[5];
        this.senderSign = tx[6];
        this.reciverSign = tx[7];
    }

    signSender(senderKeys) {
        this.senderSign = senderKeys.sign(this.baseString()).toDER('hex');
    }

    signReciver(reciverKeys) {
        this.reciverSign = reciverKeys.sign(this.baseString() + this.senderSign).toDER('hex');
    }

    amountFor(user_id) {
        if (this.from == user_id) {
            return -this.amount;
        }

        if (this.to == user_id) {
            return this.amount;
        }

        throw "User not in transaction";
    }
  }


// Generate a key pair
const senderKeys = ec.genKeyPair();
const reciverKeys = ec.genKeyPair();

let senderLedger = new Ledger(1);
let reciverLedger = new Ledger(2);

senderLedger.topUp(1000);
reciverLedger.topUp(1000);


lasttx_sender = senderLedger.getLastTransaction().id
lasttx_reciver = reciverLedger.getLastTransaction().id
let transaction = new Transaction(lasttx_sender + 1, 1, 2, 100, lasttx_sender, lasttx_reciver);
transaction.signSender(senderKeys);
transaction.signReciver(reciverKeys);

senderLedger.addTransaction(transaction);
reciverLedger.addTransaction(transaction);

console.log(transaction.toString());

console.log(senderLedger.toString());

console.log(reciverLedger.toString());




