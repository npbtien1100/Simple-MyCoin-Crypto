import crypto from "crypto";
import EC from "elliptic";
const ec = new EC.ec("secp256k1");

class Transaction {
  constructor(
    fromAddress,
    toAddress,
    amount,
    timestamp = Date.now(),
    signature = ""
  ) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = timestamp;
    this.hash = this.calculateHash();
    this.signature = signature;
  }

  /**
   * Creates a SHA256 hash of the transaction
   *
   * @returns {string}
   */
  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest("hex");
  }

  /**
   * Signs a transaction with the given signingKey (which is an Elliptic keypair
   * object that contains a private key). The signature is then stored inside the
   * transaction object and later stored on the blockchain.
   *
   * @param {string} signingKey
   */
  signTransaction(signingKey) {
    // You can only send a transaction from the wallet that is linked to your
    // key. So here we check if the fromAddress matches your publicKey
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }

    // Calculate the hash of this transaction, sign it with the key
    // and store it inside the transaction object
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");

    this.signature = sig.toDER("hex");
  }

  /**
   * Checks if the signature is valid (transaction has not been tampered with).
   * It uses the fromAddress as the public key.
   *
   * @returns {boolean}
   */
  static isValid(tst) {
    // If the transaction doesn't have a from address we assume it's a
    // mining reward and that it's valid. You could verify this in a
    // different way (special field for instance)
    if (tst.fromAddress === "MyCoin system") return true;

    if (!tst.signature || tst.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(tst.fromAddress, "hex");
    return publicKey.verify(tst.hash, tst.signature);
  }

  static getInstanceFromJSON(tst) {
    return new Transaction(
      tst.fromAddress,
      tst.toAddress,
      tst.amount,
      tst.timestamp,
      tst.signature
    );
  }
}

export default Transaction;
