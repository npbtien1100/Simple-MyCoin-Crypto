import EC from "elliptic";
import fs from "fs";
const ec = new EC.ec("secp256k1");

const url = "./components/wallet/wallet.json";

class Wallet {
  /**
   * the wallet will hold the public key
   * and the private key pair
   * and the balance
   */
  constructor(privateKey = "") {
    if (privateKey === "") this.keyPair = ec.genKeyPair();
    else this.keyPair = ec.keyFromPrivate(privateKey, "hex");
    this.publicKey = this.keyPair.getPublic().encode("hex");
  }

  static saveToFile(privateKey, password) {
    const newUser = { privateKey: privateKey, password: password };
    const accounts = [...this.readFromFile(), newUser];
    fs.writeFileSync(url, JSON.stringify(accounts));
  }

  static readFromFile() {
    const strAccounts = fs.readFileSync(url, "utf8");

    const accounts = strAccounts ? JSON.parse(strAccounts) : [];
    return accounts;
  }

  static login(privateKey, password) {
    const accounts = this.readFromFile();
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      if (account.privateKey === privateKey && account.password === password) {
        return true;
      }
    }
    return false;
  }
}

export default Wallet;
