const ec = new elliptic.ec('secp256k1'); // Use the secp256k1 curve
const senderKeys = ec.genKeyPair();
const reciverKeys = ec.genKeyPair();


class Wallet {
    constructor(wallet_id, privateKey, publicKey, ledger) {
        this.keyPair = ec.genKeyPair();
        this.privateKey = privateKey || this.keyPair.getPrivate().toString('hex');
        this.publicKey = publicKey || this.keyPair.getPublic().encode('hex');
        this.id = wallet_id;

        this.ledger = ledger || new Ledger(this.id);
    }

    setId(id) {
        this.id = id;
    }

    balance() {
        return this.ledger.getBalance();
    }

    history() {
        return this.ledger.getTransactions();
    }

    reciveMoneyInformation() {
        let lastTx = this.ledger.getLastTransaction();
        return JSON.stringify({
            sender: this.id,
            lastTx: lastTx.shaHash()
        });
    }

    reciveMoney(txstr) { 
        let tx = new Transaction();
        tx.parse(txstr);
        this.ledger.addTransaction(tx);
        this.saveToLocalStorage();
    }

    sendMoney(amount, reciverInformation) {
        let receiver = JSON.parse(reciverInformation);
        let lasttx_sender = this.ledger.getLastTransaction().shaHash();
        let lasttx_reciver = receiver.lastTx;
        let reciverWalletID = receiver.sender;
        let transaction = new Transaction(this.ledger.nextId(), this.id, reciverWalletID, amount, lasttx_sender, lasttx_reciver);
        transaction.signSender(this.keyPair);

        this.ledger.addTransaction(transaction);
        this.saveToLocalStorage();
        
        return transaction.toString();
    }
    
    saveToLocalStorage() {
        this.ledger.saveToLocalStorage();
        localStorage.setItem('wallet_id', this.id);
        localStorage.setItem('privateKey', this.privateKey);
        localStorage.setItem('publicKey', this.publicKey);
    } 
    static loadFromLocalStorage() {
        if(localStorage.getItem('wallet_id') == null) {
            let new_wallet =  new Wallet(Math.floor(Math.random() * 100));
            new_wallet.saveToLocalStorage();

            return new_wallet;
        }

        let id = Number(localStorage.getItem('wallet_id'));
        let privateKey = localStorage.getItem('privateKey');
        let publicKey = localStorage.getItem('publicKey');


        let ledger = Ledger.loadFromLocalStorage(id);

        return new Wallet(id, privateKey, publicKey, ledger);
    }
}

class Ledger {
    constructor(wallet_id) {
        // id, from, to, amount, lasttx_sender, lasttx_reciver
        let init_transaction = new Transaction(Math.floor(Math.random() * 100), 0, wallet_id, 100, 0, 0); 
        this.count = 0;
        this.transactions = [init_transaction];
        this.balance = 100;

        this.wallet_id = wallet_id;
    }

    nextId() {
        this.count += 1;
        return this.count;
    }

    addTransaction(tx) {
        if (tx.amountFor(this.wallet_id) + this.balance < 0) {
            throw "Not enough money";
        }

        this.transactions.push(tx);
        this.balance += tx.amountFor(this.wallet_id);
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
            str += this.transactions[i].toString() + "%";
        }

        str = str.substring(0, str.length-1);
        return str;
    }

    fromString(str, id) {
        if (str == null) {
            return this;
        }
        this.wallet_id = id;
        let txs = str.split("%");

        this.transactions = [];
        this.balance = 0;
        for (let i = 0; i < txs.length; i++) {
            let tx = new Transaction();
            tx.parse(txs[i]);
            this.addTransaction(tx);
        }
    }

    topUp(amount) {
        let tx = new Transaction(this.transactions.length, 0, this.wallet_id, amount, 0, 0);
        this.addTransaction(tx);
    }

    saveToLocalStorage() {
        localStorage.setItem('ledger', this.toString());
    }

    static loadFromLocalStorage(id) {
        let ledger = new Ledger(id);
        ledger.fromString(localStorage.getItem('ledger'), id);

        return ledger;
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
        if (this.senderSign != null) {
            return this.baseString() + "|" + this.senderSign;
        }

        return this.baseString();
    }

    parse(txstr) {
        let tx = txstr.split("|");

        this.id = Number(tx[0]);
        this.from = Number(tx[1]);
        this.to = Number(tx[2]);
        this.amount = Number(tx[3]);
        this.lasttx_sender = tx[4];
        this.lasttx_reciver = tx[5];
        this.senderSign = tx[6];
        this.reciverSign = tx[7];
    }

    signSender(senderKeys) {
        this.senderSign = senderKeys.sign(this.baseString()).toDER('hex');
    }

    amountFor(wallet_id) {
        if (this.from == wallet_id) {
            return -this.amount;
        }

        if (this.to == wallet_id) {
            return this.amount;
        }
        throw "User not in transaction";
    }

    otherWallet(wallet_id) {
        if (this.from == wallet_id) {
            return this.to;
        }

        if (this.to == wallet_id) {
            return this.from;
        }
        throw "User not in transaction";
    }

    shaHash() {
        return CryptoJS.SHA256(this.toString()).toString();
    }
}
var wallet = Wallet.loadFromLocalStorage();