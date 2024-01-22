import {
  DirectSecp256k1Wallet,
  DirectSecp256k1HdWallet,
} from "@cosmjs/proto-signing";
import { QueryClient } from "@cosmjs/stargate";
import { SigningStargateClient, coins } from "@cosmjs/stargate";
import { StargateClient } from "@cosmjs/stargate";
import amino_1 from "@cosmjs/amino";

function toHexString(byteArray) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

const rpcEndpoint = "http://localhost:26657";

// // pubKey: cosmos1wp0anna27wg0s5v6sfk88np8v7j2g3zve8860y
// const generateKey = async () => {
//   const wallet = await DirectSecp256k1HdWallet.generate(12)
//   process.stdout.write(wallet.mnemonic)
//   const accounts = await wallet.getAccounts()
//   console.error("Mnemonic with 1st account:", accounts[0].address)
//   return accounts
// }

const clientQuery = await StargateClient.connect(rpcEndpoint);
console.log(
  "With client, chain id:",
  await clientQuery.getChainId(),
  ", height:",
  await clientQuery.getHeight()
);

const testMnemonic =
  "law net member pool drive attack receive tide worry animal chef novel";
const test = await DirectSecp256k1HdWallet.fromMnemonic(testMnemonic, {
  prefix: "xion",
});
const testAccount = await test.getAccounts();
console.log("test account: ", testAccount);

const faucetMnemonic =
  "decorate corn happy degree artist trouble color mountain shadow hazard canal zone hunt unfold deny glove famous area arrow cup under sadness salute item";
const faucet = await DirectSecp256k1HdWallet.fromMnemonic(faucetMnemonic, {
  prefix: "xion",
});
const faucetAccount = await faucet.getAccounts();
console.log("faucet account: ", faucetAccount);

const balanceFaucet = await clientQuery.getAllBalances(
  faucetAccount[0].address
);
const balanceTestAcc = await clientQuery.getAllBalances(testAccount[0].address);

console.log("Faucet Balance:", balanceFaucet);
console.log("Test Account Balance:", balanceTestAcc);

const sendingAmount = [
  {
    amount: "1000",
    denom: "uxion", // 1 million uxion = 1 xion
  },
];

const fee = {
  amount: [{ denom: "uxion", amount: "100" }],
  gas: "200000",
};

// const faucetClient = await SigningStargateClient.connectWithSigner(
//   rpcEndpoint,
//   faucet
// );

// const result = await faucetClient.sendTokens(
//   faucetAccount[0].address,
//   testAccount[0].address,
//   sendingAmount,
//   fee
// );
// console.log(result);
