import amino_1 from "@cosmjs/amino";
import crypto_1 from "@cosmjs/crypto";
import encoding_1 from "@cosmjs/encoding";
import proto_signing_1 from "@cosmjs/proto-signing";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient, coins } from "@cosmjs/stargate";
import { StargateClient } from "@cosmjs/stargate";
import math_1 from "@cosmjs/math";
import { ExtendedSecp256k1Signature } from "@cosmjs/crypto";
import tx_1 from "cosmjs-types/cosmos/tx/v1beta1/tx.js";
import elliptic_1 from "elliptic";
import signing_1 from "cosmjs-types/cosmos/tx/signing/v1beta1/signing.js";
import { AminoTypes, createDefaultAminoConverters } from "@cosmjs/stargate";

// secp256k1 curve
const secp256k1 = new elliptic_1.ec("secp256k1");

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

// Intital Set Up
const rpcEndpoint = "http://localhost:26657";
const Stargate_Client = await StargateClient.connect(rpcEndpoint);
const aminoTypes = new AminoTypes(createDefaultAminoConverters());
const chainId = await Stargate_Client.getChainId();
const senderMnemonic =
  "law net member pool drive attack receive tide worry animal chef novel";
const sender = await DirectSecp256k1HdWallet.fromMnemonic(senderMnemonic, {
  prefix: "xion",
});
const signMode = signing_1.SignMode.SIGN_MODE_LEGACY_AMINO_JSON;

// This is for test
const senderAccount = await sender.getAccounts(); // sender.getAccountsWithPrivkeys(); - get account info with PrivKey
const senderPrivKey = (await sender.getAccountsWithPrivkeys())[0].privkey;
const senderPubkey = (await sender.getAccountsWithPrivkeys())[0].pubkey;
const keyPair = secp256k1.keyFromPrivate(senderPrivKey);
const senderClient = await SigningStargateClient.connectWithSigner(
  rpcEndpoint,
  senderAccount
);
const { accountNumber, sequence } = await Stargate_Client.getSequence(
  senderAccount[0].address
);
const pubkeyTestAcc = proto_signing_1.encodePubkey(
  amino_1.encodeSecp256k1Pubkey(senderAccount[0].pubkey) // this will add 2 more bytes in the MSB of testAccount pubkey
);

// This is input from Front End
const recipientAddress = "xion1e2fuwe3uhq8zd9nkkk876nawrwdulgv460vzg7";
const sendingAmount = [
  {
    amount: "1000",
    denom: "uxion",
  },
];
const fee = {
  amount: [{ denom: "uxion", amount: "0" }],
  gas: "200000",
};

const sendMsg = {
  typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  value: {
    fromAddress: senderAccount[0].address,
    toAddress: recipientAddress,
    amount: sendingAmount,
  },
};

const sendMsgArray = [sendMsg];

const condition = proto_signing_1.isOfflineDirectSigner(senderAccount);

let hashedMessage;

// Contruction TF before signing
if (condition == true) {
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
  hashedMessage = crypto_1.sha256(signBytes);
} else {
}

// ------------- signDirect --------------- //

// const { r, s, recoveryParam } = keyPair.sign(hashedMessage, {
//   canonical: true,
// });
// const signature = new ExtendedSecp256k1Signature(
//   Uint8Array.from(r.toArray()),
//   Uint8Array.from(s.toArray()),
//   recoveryParam
// );
// const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
// const stdSignature = amino_1.encodeSecp256k1Signature(
//   senderPubkey,
//   signatureBytes
// );
// const temp = tx_1.TxRaw.fromPartial({
//   bodyBytes: signDoc.bodyBytes,
//   authInfoBytes: signDoc.authInfoBytes,
//   signatures: [encoding_1.fromBase64(stdSignature.signature)],
// });
// const txBytes = tx_1.TxRaw.encode(temp).finish();
// Stargate_Client.broadcastTx(txBytes);

// ------------- signAmino --------------- //
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
hashedMessage = crypto_1.sha256(amino_1.serializeSignDoc(signDoc));

const { r, s, recoveryParam } = keyPair.sign(hashedMessage, {
  canonical: true,
});
const signature = new ExtendedSecp256k1Signature(
  Uint8Array.from(r.toArray()),
  Uint8Array.from(s.toArray()),
  recoveryParam
);
const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
const stdSignature = amino_1.encodeSecp256k1Signature(
  senderPubkey,
  signatureBytes
);
const signedTxBody = {
  messages: signDoc.msgs.map((msg) => aminoTypes.fromAmino(msg)),
  memo: signDoc.memo,
  timeoutHeight: undefined,
};
const signedTxBodyEncodeObject = {
  typeUrl: "/cosmos.tx.v1beta1.TxBody",
  value: signedTxBody,
};
const signedTxBodyBytes = senderClient.registry.encode(
  signedTxBodyEncodeObject
);
const signedGasLimit = math_1.Int53.fromString(signDoc.fee.gas).toNumber();
const signedSequence = math_1.Int53.fromString(signDoc.sequence).toNumber();
const signedAuthInfoBytes = proto_signing_1.makeAuthInfoBytes(
  [{ pubkey: pubkeyTestAcc, sequence: signedSequence }],
  signDoc.fee.amount,
  signedGasLimit,
  undefined,
  undefined,
  signMode
);
const temp = tx_1.TxRaw.fromPartial({
  bodyBytes: signedTxBodyBytes,
  authInfoBytes: signedAuthInfoBytes,
  signatures: [encoding_1.fromBase64(stdSignature.signature)],
});
const txBytes = tx_1.TxRaw.encode(temp).finish();

console.log(recoveryParam)

// Stargate_Client.broadcastTx(txBytes);
