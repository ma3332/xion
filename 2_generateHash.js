import amino_1 from "@cosmjs/amino";
import crypto_1 from "@cosmjs/crypto";
import proto_signing_1 from "@cosmjs/proto-signing";
import { SigningStargateClient, coins } from "@cosmjs/stargate";
import { StargateClient } from "@cosmjs/stargate";
import math_1 from "@cosmjs/math";
import tx_1 from "cosmjs-types/cosmos/tx/v1beta1/tx.js";
import { AminoTypes, createDefaultAminoConverters } from "@cosmjs/stargate";
import { accountFullInfo } from "./0_privKeytoAddressCosmos.js";
import { recipientAddress, sendingAmount } from "./1_inputFromClient.js";
import { check } from "./0_privKeytoAddressCosmos.js";

// Utils function
function makeSignBytes({ accountNumber, authInfoBytes, bodyBytes, chainId }) {
  const signDoc = tx_1.SignDoc.fromPartial({
    accountNumber: accountNumber,
    authInfoBytes: authInfoBytes,
    bodyBytes: bodyBytes,
    chainId: chainId,
  });
  return tx_1.SignDoc.encode(signDoc).finish();
}

const rpcEndpoint = "http://localhost:26657";
const Stargate_Client = await StargateClient.connect(rpcEndpoint);
const chainId = await Stargate_Client.getChainId();
const senderClient = await SigningStargateClient.connectWithSigner(
  rpcEndpoint,
  accountFullInfo
);
const { accountNumber, sequence } = await Stargate_Client.getSequence(
  accountFullInfo[0].address
);
const pubkeyTestAcc = proto_signing_1.encodePubkey(
  amino_1.encodeSecp256k1Pubkey(accountFullInfo[0].pubkey) // this will add 2 more bytes in the MSB of testAccount pubkey
);
const aminoTypes = new AminoTypes(createDefaultAminoConverters());
const fee = {
  amount: [{ denom: "uxion", amount: "500" }], // Fixed fee
  gas: "200000",
};

const sendMsg = {
  typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  value: {
    fromAddress: accountFullInfo[0].address,
    toAddress: recipientAddress,
    amount: sendingAmount,
  },
};

const sendMsgArray = [sendMsg];

function hashedMsgDirect() {
  const txBodyEncodeObject = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: {
      messages: sendMsgArray,
      memo: undefined,
      timeoutHeight: undefined,
    },
  };
  const txBodyBytes = senderClient.registry.encode(txBodyEncodeObject);
  const gasLimit = math_1.Int53.fromString(fee.gas).toNumber();
  const authInfoBytes = proto_signing_1.makeAuthInfoBytes(
    [{ pubkeyTestAcc, sequence }],
    fee.amount,
    gasLimit
  );
  const signDoc = proto_signing_1.makeSignDoc(
    txBodyBytes,
    authInfoBytes,
    chainId,
    accountNumber
  );
  const signBytes = makeSignBytes(signDoc);
  const hashedMessage = crypto_1.sha256(signBytes);
  return { hash: hashedMessage, signDoc: signDoc };
}

function hashedMsgAmino() {
  const msgs = sendMsgArray.map((msg) => aminoTypes.toAmino(msg));
  const signDoc = amino_1.makeSignDoc(
    msgs,
    fee,
    chainId,
    undefined,
    accountNumber,
    sequence,
    undefined
  );
  const hashedMessage = crypto_1.sha256(amino_1.serializeSignDoc(signDoc));
  return { hash: hashedMessage, signDoc: signDoc };
}

let hashedMsg;
let signDoc;

if (check) {
  hashedMsg = hashedMsgDirect().hash;
  signDoc = hashedMsgDirect().signDoc;
} else {
  hashedMsg = hashedMsgAmino().hash;
  signDoc = hashedMsgAmino().signDoc;
}

export { hashedMsg, signDoc };
