import elliptic_1 from "elliptic";
import { hashedMsg } from "./2_generateHash.js";

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

// secp256k1 curve
const secp256k1 = new elliptic_1.ec("secp256k1");

const keyPair = secp256k1.keyFromPrivate(hexStringToByteArray(privKey));

const { r, s, recoveryParam } = keyPair.sign(hashedMsg, {
  canonical: true,
});

export { r, s, recoveryParam };
