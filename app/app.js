import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import indexRouter from "../routes/index.js";
import usersRouter from "../routes/users.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

import Blockchain from "../components/blockChain/blockChain.js";
import P2pserver from "./p2p-server.js";

import EC from "elliptic";
import Wallet from "../components/wallet/wallet.js";
import Transaction from "../components/transaction/transaction.js";
const ec = new EC.ec("secp256k1");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

const MyCoin = new Blockchain();
let wallet = null;
// Your private key goes here
const myKey = ec.keyFromPrivate(
  "7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf"
);
// From that we can calculate your public key (which doubles as your wallet address)
const myWalletAddress = myKey.getPublic("hex");
const p2pserver = new P2pserver(MyCoin);

app.use("/", indexRouter);
app.use("/users", usersRouter);
//api to get the blocks
app.get("/blocks", (req, res) => {
  res.json(MyCoin.chain);
});
app.get("/blockchain", (req, res) => {
  res.json(MyCoin);
});
//api to add blocks
app.post("/mine", (req, res) => {
  //const block = MyCoin.addBlock(req.body.data);
  console.log(`New block added: ${block.toString()}`);

  /**
   * use the synchain method to synchronise the
   * state of the blockchain
   */
  p2pserver.syncChain();
  res.redirect("/blocks");
});

// api to start mining
app.get("/mine-transactions", (req, res) => {
  const block = MyCoin.minePendingTransactions(wallet.publicKey);

  p2pserver.broadcastBlock(block);

  res.redirect("/blocks");
});

// api to view transaction in the transaction pool
app.get("/transactions", (req, res) => {
  res.json(MyCoin.transactionsPool);
});

// create transactions
app.post("/transact", (req, res) => {
  try {
    const { recipient, amount } = req.body;

    console.log(`Recipient: ${recipient} | Amount: ${amount}`);

    const txt = new Transaction(wallet.publicKey, recipient, parseInt(amount));
    txt.signTransaction(wallet.keyPair);
    MyCoin.addTransaction(txt);

    p2pserver.broadcastTransaction(txt);
    res.send(txt);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

// get public key
app.get("/public-key", (req, res) => {
  res.json({ publicKey: wallet.publicKey });
});

// p2p server configuration
p2pserver.listen();

//===================================== MVC =====================================
// VIEW CONTROLLER
//const account = new Account();
// account.saveToFile(wallet.publicKey);

app.get("/test", (req, res) => {
  //   res.render("index", {
  //     title: "Test",
  //     chains: JSON.stringify(blockchain.chain),
  //     publicKey: wallet.publicKey,
  //     balance: wallet.calculateBalance(blockchain),
  //   });
});

app.get("/history", (req, res) => {
  let chains = [...blockchain.chain];
  let transactions = [...transactionPool.transactions];

  chains = chains.map((chain) => {
    if (
      chain.data != null &&
      chain.data != undefined &&
      chain.data.length > 0
    ) {
      chain.miner = chain.data[0].outputs[0].address;
      chain.miner = formatString(chain.miner);
    }

    chain.hash = formatString(chain.hash);
    chain.lastHash = formatString(chain.lastHash);

    return chain;
  });
  //from to
  //amount
  //id
  transactions = transactions.map((transaction) => {
    transaction.from = formatString(transaction.outputs[0].address);
    transaction.to = formatString(transaction.outputs[1].address);
    transaction.amount = transaction.outputs[1].amount;
    transaction.id = formatString(transaction.id);
    return transaction;
  });

  res.render("history/index", { title: "History", chains, transactions });
});

app.post("/login", (req, res) => {
  const { privateKey, password } = req.body;
  const isLogin = Wallet.login(privateKey, password);

  if (isLogin) {
    wallet = new Wallet(privateKey);
    res.send("Login Success");
  } else {
    res.send("Invalid username or password");
  }
});

app.post("/register", (req, res) => {
  const privateKey = ec.genKeyPair().getPrivate("hex");
  const password = req.body.password;
  Wallet.saveToFile(privateKey, password);
  res.json({
    privateKey,
    password,
  });
});

export default app;
