import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import dotenv from "dotenv";

dotenv.config();
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.RPC_URL_KEY || "",
        blockNumber: parseInt(process.env.FORK_BLOCK_NUMBER || "0"), // Optional: Specify a block number for forking
      },
    },
    baseSepolia: {
      url: process.env.RPC_URL_KEY || "",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    Sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // The first account from the configured accounts array
    },
    user: {
      default: 1, // Second account (useful for testing scenarios)
    },
  },
};

export default config;
