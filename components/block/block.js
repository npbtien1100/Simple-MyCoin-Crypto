import crypto from "crypto";
import debugLib from "debug";
import Transaction from "../transaction/transaction.js";
const debug = debugLib("mycoin:server");

class Block {
  constructor(
    index,
    timestamp,
    transactions,
    difficulty,
    previousHash = "",
    nonce = 0
  ) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.nonce = nonce;
    this.difficulty = difficulty;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce +
          this.difficulty
      )
      .digest("hex");
  }

  /**
   * Starts the mining process on the block. It changes the 'nonce' until the hash
   * of the block starts with enough zeros (= difficulty)
   *
   * @param {number} difficulty
   */
  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    debug(`Block mined: ${this.hash}`);
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!Transaction.isValid(tx)) {
        return false;
      }
    }

    return true;
  }

  nonce = 0;
  static getInstanceFromJSON(block) {
    return new Block(
      block.index,
      block.timestamp,
      block.transactions,
      block.difficulty,
      block.previousHash,
      block.nonce
    );
  }
}

export default Block;
