import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import createError from "http-errors";

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
const p2pserver = new P2pserver(MyCoin);

const requireLogin = (req, res, next) => {
  if (wallet) {
    return next();
  }
  res.redirect("/login");
};
const requireLogout = (req, res, next) => {
  if (!wallet) {
    return next();
  }
  res.redirect("/wallet");
};
app.get("/", (req, res) => {
  res.redirect("/wallet");
});
//Blockchain information
app.get("/blockchain", requireLogin, (req, res) => {
  const blockchain = {
    difficulty: MyCoin.difficulty,
    difficulty_adjusment_interval: MyCoin.DIFFICULTY_ADJUSTMENT_INTERVAL,
    block_generation_interval: MyCoin.BLOCK_GENERATION_INTERVAL,
    initial_balance: MyCoin.initial_balance,
    miningReward: MyCoin.miningReward,
    totalNode: p2pserver.sockets.length,
  };
  const blocks = MyCoin.chain.map((el) => {
    return { ...el, timestamp: new Date(el.timestamp).toLocaleString() };
  });
  res.render("blockchain", { blockchain, blocks });
});

//wallet information
app.get("/wallet", requireLogin, (req, res) => {
  try {
    const publicKey = wallet.publicKey;
    const privateKey = wallet.keyPair.getPrivate("hex");

    const balance = MyCoin.getBalanceOfAddress(publicKey);

    const myWallet = { publicKey, privateKey, balance };
    res.render("index", { myWallet });
  } catch (err) {
    console.log(err);
  }
});
//mining coin
app.get("/mine-coin", requireLogin, (req, res) => {
  try {
    const transactionPool = MyCoin.transactionsPool.map((el) => {
      return { ...el, timestamp: new Date(el.timestamp).toLocaleString() };
    });
    res.render("minecoin", { transactionPool });
  } catch (err) {
    console.log(err);
  }
});
// api to start mining
app.get("/mine-transactions", requireLogin, (req, res) => {
  try {
    const block = MyCoin.minePendingTransactions(wallet.publicKey);

    p2pserver.broadcastBlock(block);

    res.json({
      message:
        "Mining Block Successfully! Mining reward was send to your wallet",
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});
//send coin
app.get("/send-coin", requireLogin, (req, res) => {
  const publicKey = wallet.publicKey;
  const balance = MyCoin.getBalanceOfAddress(publicKey);
  const myWallet = { balance };

  res.render("sendcoin", { myWallet });
});
// create transactions
app.post("/transaction", requireLogin, (req, res) => {
  try {
    const { recipient, amount } = req.body;

    console.log(`Recipient: ${recipient} | Amount: ${amount}`);

    const txt = new Transaction(wallet.publicKey, recipient, parseInt(amount));
    txt.signTransaction(wallet.keyPair);
    MyCoin.addTransaction(txt);

    p2pserver.broadcastTransaction(txt);
    res.json({ message: "Send coin successfully!" });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

//===================================== MVC =====================================
//transaction histroy
app.get("/transactions", requireLogin, (req, res) => {
  const transactionPool = MyCoin.transactionsPool.map((el) => {
    return { ...el, timestamp: new Date(el.timestamp).toLocaleString() };
  });
  const validTransaction = MyCoin.getAllTransaction().map((el) => {
    return { ...el, timestamp: new Date(el.timestamp).toLocaleString() };
  });
  const title = {
    big: "Transaction history",
    small: "All the transactions of System",
    table: "All transactions",
  };
  res.render("alltransaction", { transactionPool, validTransaction, title });
});
app.get("/my-transactions", requireLogin, (req, res) => {
  const address = wallet.publicKey;
  const transactionPool = MyCoin.transactionsPool
    .filter((tx) => tx.fromAddress === address || tx.toAddress === address)
    .map((el) => {
      return { ...el, timestamp: new Date(el.timestamp).toLocaleString() };
    });
  const validTransaction = MyCoin.getAllTransactionsForWallet(
    wallet.publicKey
  ).map((el) => {
    return { ...el, timestamp: new Date(el.timestamp).toLocaleString() };
  });

  const title = {
    big: "My transactions",
    small: "All the transactions of my wallet",
    table: "All transactions",
  };
  res.render("alltransaction", { transactionPool, validTransaction, title });
});

//register, login, logout
app.get("/login", requireLogout, (req, res) => {
  res.render("login", { layout: false });
});
app.get("/logout", (req, res) => {
  wallet = null;
  res.redirect("/login");
});
app.post("/login", (req, res) => {
  const { privateKey, password } = req.body;
  const isLogin = Wallet.login(privateKey, password);

  if (isLogin) {
    wallet = new Wallet(privateKey);
    res.status(200).json({ message: "Login successfully" });
  } else {
    res.status(401).json({ message: "Invalid key or password" });
  }
});

app.get("/register", requireLogout, (req, res) => {
  const keyPair = ec.genKeyPair();
  const publicKey = keyPair.getPublic().encode("hex");
  const privateKey = keyPair.getPrivate("hex");
  res.render("register", { layout: false, key: { publicKey, privateKey } });
});
app.post("/register", (req, res) => {
  try {
    console.log("post to register");
    const { privateKey, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      console.log("Co chay vao day");
      return res
        .status(400)
        .json({ message: "Password and Confirm password is not identical!" });
    } else if (!privateKey) {
      console.log("Co chay vao private");
      return res.status(400).json({ message: "privateKey is required!" });
    }
    Wallet.saveToFile(privateKey, password);
    res.json({ message: "Create wallet successfully!" });
  } catch (err) {
    console.log(err);
    return res.status(err.status || 500).json({ message: err.message });
  }
});
app.get("/api/create-keypair", (req, res) => {
  try {
    const keyPair = ec.genKeyPair();
    const publicKey = keyPair.getPublic().encode("hex");
    const privateKey = keyPair.getPrivate("hex");
    res.status(200).json({ publicKey: publicKey, privateKey: privateKey });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("404", { layout: false });
});

// p2p server configuration
p2pserver.listen();

export default app;
