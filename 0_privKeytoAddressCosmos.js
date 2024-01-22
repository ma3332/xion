import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import proto_signing_1 from "@cosmjs/proto-signing";

import dotenv from "dotenv";
dotenv.config();

function hexStringToByteArray(hexString) {
  if (hexString.length % 2 !== 0) {
    throw "Must have an even number of hex digits to convert to bytes";
  }
  var numBytes = hexString.length / 2;
  var byteArray = new Uint8Array(numBytes);
  for (var i = 0; i < numBytes; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return byteArray;
}
let privKey = process.env.PRIVATE_KEY;
const account = await DirectSecp256k1Wallet.fromKey(
  hexStringToByteArray(privKey),
  "xion"
);
const accountFullInfo = await account.getAccounts();

let check = proto_signing_1.isOfflineDirectSigner(accountFullInfo);

export { accountFullInfo, check };
