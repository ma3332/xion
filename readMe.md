# Clone từ Repo

https://github.com/burnt-labs/xion

# Cài đặt

1. WSL (sudo apt update)
2. Cài đặt Go in WSL

- curl -OL https://golang.org/dl/go1.21.6.linux-amd64.tar.gz
- sudo tar -C /usr/local -xvf go1.21.6.linux-amd64.tar.gz
- sudo nano ~/.profile
- . . . export PATH=$PATH:/usr/local/go/bin (copy vào bên dưới)
- source ~/.profile
- go version

3. Cài đặt Rust in WSL
4. Cài đặt Docker in WSL

# Chạy file clone về:

1. sudo docker compose up -d
- Nó sẽ expose rpcEndpoint = "http://localhost:26657". Đây chính là provider để test
- Faucet: trong file test.js. Chạy file này để cung cấp uxion cho địa chỉ nào đó

# Các file JS
0. .env: Mô Phỏng Private Key trong Wallet
1. test.js: lấy từ Faucet
2. 0_privKeytoAddressCosmos.js: Lấy PubKey từ PrivateKey trong Wallet
3. 1_inputFromClient.js: input từ Client
4. 2_generateHash.js: tạo msg hash từ Client
5. 3_signInWallet.js: file giả định kí trong Wallet, trả về r, s và recoverParams
6. 4_getFromWalletAndBroadcast.js: file nhận r, s và recoverParams từ Wallet và gửi lên Blockchain


