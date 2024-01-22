import amino_1 from "@cosmjs/amino";
import encoding_1 from "@cosmjs/encoding";
import proto_signing_1 from "@cosmjs/proto-signing";
import { SigningStargateClient, coins } from "@cosmjs/stargate";
import { StargateClient } from "@cosmjs/stargate";
import math_1 from "@cosmjs/math";
import { ExtendedSecp256k1Signature } from "@cosmjs/crypto";
import tx_1 from "cosmjs-types/cosmos/tx/v1beta1/tx.js";
import signing_1 from "cosmjs-types/cosmos/tx/signing/v1beta1/signing.js";
import { AminoTypes, createDefaultAminoConverters } from "@cosmjs/stargate";
import { accountFullInfo, check } from "./0_privKeytoAddressCosmos.js";
import { r, s, recoveryParam } from "./3_signInWallet.js";
import { signDoc } from "./2_generateHash.js";

const rpcEndpoint = "http://localhost:26657";
const pubkeyTestAcc = proto_signing_1.encodePubkey(
  amino_1.encodeSecp256k1Pubkey(accountFullInfo[0].pubkey) // this will add 2 more bytes in the MSB of testAccount pubkey
);
const Stargate_Client = await StargateClient.connect(rpcEndpoint);
const aminoTypes = new AminoTypes(createDefaultAminoConverters());
const signMode = signing_1.SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
const senderClient = await SigningStargateClient.connectWithSigner(
  rpcEndpoint,
  accountFullInfo
);

// get r, s, v from Wallet
const signature = new ExtendedSecp256k1Signature(
  Uint8Array.from(r.toArray()),
  Uint8Array.from(s.toArray()),
  recoveryParam
);
const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
const stdSignature = amino_1.encodeSecp256k1Signature(
  accountFullInfo[0].pubkey,
  signatureBytes
);

let txBytesBroadcast;

function txBytesGenDirect() {
  const temp = tx_1.TxRaw.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    signatures: [encoding_1.fromBase64(stdSignature.signature)],
  });
  const txBytes = tx_1.TxRaw.encode(temp).finish();
  return txBytes;
}

function txBytesGenAmino() {
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
  return txBytes;
}

if (check) {
  txBytesBroadcast = txBytesGenDirect();
} else {
  txBytesBroadcast = txBytesGenAmino();
}

Stargate_Client.broadcastTx(txBytesBroadcast);
