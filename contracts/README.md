# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

```shell
npx hardhat deploy:all --network <NETWORK>

# Deploy videoNFT contract
npx hardhat deploy:videoNFT --network <NETWORK>

# Deploy PurchaseManagerStorage contract
npx hardhat deploy:pmStorage --netword <NETWORK>

# Deploy PurchaseManager contract
npx hardhat deploy:pm --nft <NFT_CONTRACT_ADDRESS> --storage <PM_STORAGE_ADDRESS> --network <NETWORK>

# Verify Purchase Manager ontract
npx hardhat verify --constructor-args pmConstructorArgs.js --network <NETWORK> <PM_ADDRESS>

```
