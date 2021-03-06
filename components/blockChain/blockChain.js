import debugLib from "debug";
const debug = debugLib("mycoin:server");
import Block from "../block/block.js";
import Transaction from "../transaction/transaction.js";

class Blockchain {
  constructor() {
    this.difficulty = 4;
    this.transactionsPool = [];
    this.miningReward = 10;
    this.DIFFICULTY_ADJUSTMENT_INTERVAL = 2016;
    this.BLOCK_GENERATION_INTERVAL = 10;
    this.initial_balance = 300;
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(1, Date.parse("2022-04-30"), [], this.difficulty, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Takes all the pending transactions, puts them in a Block and starts the
   * mining process. It also adds a transaction to send the mining reward to
   * the given address.
   *
   * @param {string} miningRewardAddress
   */
  minePendingTransactions(miningRewardAddress) {
    if (this.transactionsPool.length > 0) {
      const rewardTx = new Transaction(
        "MyCoin system",
        miningRewardAddress,
        this.miningReward
      );
      this.transactionsPool.push(rewardTx);

      const difficulty = this.getDifficulty();
      const block = new Block(
        this.chain.length + 1,
        Date.now(),
        this.transactionsPool,
        difficulty,
        this.getLatestBlock().hash
      );
      block.mineBlock(this.difficulty);

      debug("Block successfully mined!");
      this.chain.push(block);

      this.transactionsPool = [];
      return block;
    }
  }

  getDifficulty() {
    const latestBlock = this.getLatestBlock();
    if (
      latestBlock.index % this.DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
      latestBlock.index !== 0
    ) {
      this.getAdjustedDifficulty();
    }
    return this.difficulty;
  }
  getAdjustedDifficulty() {
    const prevAdjustmentBlock =
      this.chain[this.chain.length - this.DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected =
      this.BLOCK_GENERATION_INTERVAL * 60 * this.DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = parseInt(
      (this.getLatestBlock().timestamp - prevAdjustmentBlock.timestamp) / 1000
    );
    if (timeTaken < timeExpected / 2) {
      this.difficulty = prevAdjustmentBlock.difficulty + 1;
    } else if (timeTaken > timeExpected * 2) {
      this.difficulty = prevAdjustmentBlock.difficulty - 1;
    }
  }
  /**
   * Add a new transaction to the transactions pool (to be added
   * next time the mining process starts). This verifies that the given
   * transaction is properly signed.
   *
   * @param {Transaction} transaction
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address");
    }

    // Verify the transactiion
    if (!Transaction.isValid(transaction)) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    if (transaction.amount <= 0) {
      throw new Error("Transaction amount should be higher than 0");
    }

    // Making sure that the amount sent is not greater than existing balance
    const walletBalance = this.getBalanceOfAddress(transaction.fromAddress);
    console.log({ walletBalance });
    if (walletBalance < transaction.amount) {
      throw new Error("Not enough balance");
    }

    // Get all other pending transactions for the "from" wallet
    const pendingTxForWallet = this.transactionsPool.filter(
      (tx) => tx.fromAddress === transaction.fromAddress
    );

    // If the wallet has more pending transactions, calculate the total amount
    // of spend coins so far. If this exceeds the balance, we refuse to add this
    // transaction.
    if (pendingTxForWallet.length > 0) {
      const totalPendingAmount = pendingTxForWallet
        .map((tx) => tx.amount)
        .reduce((prev, curr) => prev + curr);

      const totalAmount = totalPendingAmount + transaction.amount;
      console.log({ totalAmount });
      if (totalAmount > walletBalance) {
        throw new Error(
          "Pending transactions for this wallet is higher than its balance."
        );
      }
    }

    this.transactionsPool.push(transaction);
    debug("transaction added: %s", transaction);
  }

  getBalanceOfAddress(address) {
    let balance = this.initial_balance;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }
        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    debug("getBalanceOfAdrees: %s", balance);
    return balance;
  }

  getAllTransactionsForWallet(address) {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    debug("get transactions for wallet count: %s", txs.length);
    return txs;
  }

  getAllTransaction() {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        txs.push(tx);
      }
    }

    debug("get transactions for wallet count: %s", txs.length);
    return txs;
  }
  /**
   * Loops over all the blocks in the chain and verify if they are properly
   * linked together and nobody has tampered with the hashes. By checking
   * the blocks it also verifies the (signed) transactions inside of them.
   *
   * @returns {boolean}
   */
  isChainValid(chain) {
    // Check if the Genesis block hasn't been tampered with by comparing
    // the output of createGenesisBlock with the first block on our chain
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(chain[0])) {
      return false;
    }

    // Check the remaining blocks on the chain to see if there hashes and
    // signatures are correct
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = Block.getInstanceFromJSON(chain[i]);
      const previousBlock = chain[i - 1];

      if (previousBlock.index + 1 !== currentBlock.index) {
        return false;
      }

      if (previousBlock.hash !== currentBlock.previousHash) {
        return false;
      }

      if (!currentBlock.isBlockValid()) {
        return false;
      }
    }

    return true;
  }

  replaceChain(newBlockChain) {
    const newChain = newBlockChain.chain;
    if (newChain.length <= this.chain.length) {
      console.log("Recieved chain is not longer than the current chain");
      return;
    } else if (!this.isChainValid(newChain)) {
      console.log("Recieved chain is invalid");
      return;
    }

    this.chain = newBlockChain.chain;
    this.difficulty = newBlockChain.difficulty;
    this.transactionsPool = newBlockChain.transactionsPool;
    console.log("Replacing the current chain with new chain");
  }

  addBlock(block) {
    if (block.isBlockValid()) {
      this.chain.push(block);
      this.difficulty = block.difficulty;
      this.transactionsPool = [];
    }
  }
}

export default Blockchain;
