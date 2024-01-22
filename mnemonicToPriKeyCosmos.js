import {
  DirectSecp256k1Wallet,
  DirectSecp256k1HdWallet,
} from "@cosmjs/proto-signing";
import dotenv from "dotenv";
dotenv.config();

function toHexString(byteArray) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

const testMnemonic =
  "law net member pool drive attack receive tide worry animal chef novel";
const test = await DirectSecp256k1HdWallet.fromMnemonic(testMnemonic, {
  prefix: "xion",
});
const testAccount = await test.getAccounts();

const testAccountFull = await test.getAccountsWithPrivkeys();

const testAccountPriv = toHexString(testAccountFull[0].privkey);

console.log("0x" + testAccountPriv);

let x = process.env.PRIVATE_KEY;
console.log(x);
