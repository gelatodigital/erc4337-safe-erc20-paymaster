import { FaEthereum, FaBitcoin } from "react-icons/fa";
import { HiOutlineCurrencyDollar } from "react-icons/hi";

// Base Sepolia Token Addresses
// export const usdcAddress="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
// export const wethAddress = "0x4200000000000000000000000000000000000006";
// export const DaiAddress = "0xE6F6e27c0BF1a4841E3F09d03D7D31Da8eAd0a27";
// export const wbtcAddress = "0x4131600fd78Eb697413cA806A8f748edB959ddcd";
// export const usdtAddress = "0x323e78f944A9a1FcF3a10efcC5319DBb0bB6e673";

// Polygon Amoy Token Addresses
export const usdcAddress = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
export const wethAddress = "0xf8127Cb8b432F0b41baE2e01DBf719d3260b9295";

export const ZERODEV_PROJECT_ID = ""; // Project Id for Polygon Amoy

export const TOKEN_CONFIG = {
  USDC: {
    address: usdcAddress,
    symbol: "USDC",
    decimals: 6,
    icon: HiOutlineCurrencyDollar,
    paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?provider=PIMLICO`,
  },
  WETH: {
    address: wethAddress,
    symbol: "WETH",
    decimals: 18,
    icon: FaEthereum,
    paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?selfFunded=true`,
  },
  // DAI: {
  //   address: DaiAddress,
  //   symbol: "DAI",
  //   decimals: 18,
  //   icon: HiOutlineCurrencyDollar,
  //   paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?selfFunded=true`,
  // },
  // WBTC: {
  //   address: wbtcAddress,
  //   symbol: "WBTC",
  //   decimals: 18,
  //   icon: FaBitcoin,
  //   paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?selfFunded=true`,
  // },
  // USDT: {
  //   address: usdtAddress,
  //   symbol: "USDT",
  //   decimals: 18,
  //   icon: HiOutlineCurrencyDollar,
  //   paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_PROJECT_ID}?selfFunded=true`,
  // },
};
