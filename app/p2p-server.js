import { WebSocketServer, WebSocket } from "ws";
import Block from "../components/block/block.js";
import Transaction from "../components/transaction/transaction.js";
//declare the peer to peer server port
const P2P_PORT = process.env.P2P_PORT || 5001;

//list of address to connect to
const peers = process.env.PEERS ? process.env.PEERS.split(",") : [];

const MESSAGE_TYPE = {
  blockChain: "BLOCKCHAIN",
  transaction: "TRANSACTION",
  clear_transactions: "CLEAR_TRANSACTIONS",
  block: "BLOCK",
};
class P2pserver {
  constructor(blockchain) {
    this.blockChain = blockchain;
    this.sockets = [];
  }

  // create a new p2p server and connections

  listen() {
    // create the p2p server with port as argument with  cors disabled
    const server = new WebSocketServer({
      port: P2P_PORT,
      verifyClient: (info, done) => {
        //verify the client
        console.log("info ", info);
        done(process.env.ALLOW_CONNECTION);
      },
    });

    // event listener and a callback function for any new connection
    // on any new connection the current instance will send the current chain
    // to the newly connected peer
    server.on("connection", (socket) => this.connectSocket(socket));

    // to connect to the peers that we have specified
    this.connectToPeers();

    console.log(`Listening for peer to peer connection on port : ${P2P_PORT}`);
  }

  // after making connection to a socket
  connectSocket(socket) {
    // push the socket too the socket array
    this.sockets.push(socket);
    console.log("Socket connected");

    // register a message event listener to the socket
    this.messageHandler(socket);

    // on new connection send the blockchain chain to the peer

    this.sendBlockChain(socket);
  }

  connectToPeers() {
    //connect to each peer
    peers.forEach((peer) => {
      // create a socket for each peer
      const socket = new WebSocket(peer);

      // open event listner is emitted when a connection is established
      // saving the socket in the array
      socket.on("open", () => this.connectSocket(socket));
    });
  }

  messageHandler(socket) {
    //on recieving a message execute a callback function
    socket.on("message", (message) => {
      const data = JSON.parse(message);
      console.log("data ", data);

      switch (data.type) {
        case MESSAGE_TYPE.blockChain:
          /**
           * call replace blockchain if the
           * recieved chain is longer it will replace it
           */
          this.blockChain.replaceChain(data.blockChain);
          break;
        case MESSAGE_TYPE.transaction:
          /**
           * add transaction to the transaction pool
           */
          try {
            const txtInstance = Transaction.getInstanceFromJSON(
              data.transaction
            );
            this.blockChain.addTransaction(txtInstance);
          } catch (err) {
            console.log(err);
          }
          break;

        case MESSAGE_TYPE.clear_transactions:
          /**
           * clear the transactionpool
           */
          this.blockchain.transactionsPool = [];
          break;
        case MESSAGE_TYPE.block:
          const blockInstance = Block.getInstanceFromJSON(data.block);
          this.blockChain.addBlock(blockInstance);
      }
    });
  }
  /**
   * helper function to send the chain instance
   */

  sendBlockChain(socket) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.blockChain,
        blockChain: this.blockChain,
      })
    );
  }

  /**
   * utility function to sync the chain
   * whenever a new block is added to
   * the blockchain
   */

  syncBlockChain() {
    this.sockets.forEach((socket) => {
      this.sendBlockChain(socket);
    });
  }

  /**
   * sends users blockchain to every peer
   * it will send individual transactions
   * not the entire pool
   */

  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => {
      this.sendTransaction(socket, transaction);
    });
  }

  /**
   * function to send transaction as a message
   * to a socket
   */

  sendTransaction(socket, transaction) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.transaction,
        transaction: transaction,
      })
    );
  }

  broadcastClearTransactions() {
    this.sockets.forEach((socket) => {
      socket.send(
        JSON.stringify({
          type: MESSAGE_TYPE.clear_transactions,
        })
      );
    });
  }

  broadcastBlock(block) {
    this.sockets.forEach((socket) => {
      this.sendBlock(socket, block);
    });
  }

  sendBlock(socket, block) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.block,
        block: block,
      })
    );
  }
}

export default P2pserver;
