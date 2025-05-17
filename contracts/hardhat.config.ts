import "dotenv/config";

import { type HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";
import "@openzeppelin/hardhat-upgrades";

// Load potential private keys from environment variables
const devPrivateKey = process.env.DEV_PRIVATE_KEY;
const prodPrivateKey = process.env.PROD_PRIVATE_KEY;

// Helper function to create accounts array safely
const getAccounts = (key: string | undefined): string[] => {
  return key ? [`0x${key.replace(/^0x/, "")}`] : [];
};

const getUSDCContractAddress = (network: string) => {
  if (network === "base") {
    return "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  } else if (network === "base_sepolia") {
    return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  }
};

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        blockNumber: 12433917,
      },
    },
    base_sepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: getAccounts(devPrivateKey),
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: getAccounts(prodPrivateKey),
    },
  },
};

task("deploy:all", "Deploys all contracts", async (_, { run }) => {
  const videoNFTAddress = await run("deploy:videoNFT");
  const pmStorageAddress = await run("deploy:pmStorage");
  await run("deploy:pm", {
    nft: videoNFTAddress,
    storage: pmStorageAddress,
  });
});

task(
  "deploy:videoNFT",
  "Deploys VideoNFT contract",
  async (_, { upgrades, ethers }) => {
    const [owner] = await ethers.getSigners();
    const VideoNFTFactory = await ethers.getContractFactory("VideoNFT");
    const videoNFT = await upgrades.deployProxy(VideoNFTFactory, [
      owner.address,
      1,
    ]);

    await videoNFT.waitForDeployment();

    const videoNFTAddress = await videoNFT.getAddress();

    console.log("VideoNFT deployed to:", videoNFTAddress);

    return videoNFTAddress;
  }
);

task(
  "deploy:pmStorage",
  "Deploy PurchaseManagerStorage contract",
  async (_, { ethers }) => {
    const [owner] = await ethers.getSigners();
    const pmStorage = await ethers.deployContract("PurchaseManagerStorage", [
      owner.address,
    ]);

    await pmStorage.waitForDeployment();

    const pmStorageAddress = await pmStorage.getAddress();

    console.log("PurchaseManagerStorage deployed to:", pmStorageAddress);

    return pmStorageAddress;
  }
);

task(
  "deploy:pm",
  "Deploy PurchaseManager contract",
  async (
    taskArgs: { nft: string; storage: string },
    { ethers, hardhatArguments }
  ) => {
    const [owner] = await ethers.getSigners();
    const { network } = hardhatArguments;
    const { nft: videoNFTAddress, storage: pmStorageAddress } = taskArgs;
    // const forwarder = TRUSTED_FORWARDER_ADDRESS;
    const usdc = getUSDCContractAddress(network as string);
    const pm = await ethers.deployContract(
      "PurchaseManager",
      [videoNFTAddress, usdc, pmStorageAddress],
      owner
    );

    await pm.waitForDeployment();

    const pmAddress = await pm.getAddress();
    console.log("PurchaseManager deployed to:", pmAddress);

    const pmStorage = await ethers.getContractAt(
      "PurchaseManagerStorage",
      pmStorageAddress,
      owner
    );

    await pmStorage.setManager(pmAddress);

    return pmAddress;
  }
)
  .addOptionalParam("nft")
  .addOptionalParam("storage");

export default config;
