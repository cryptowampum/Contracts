require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.24" }
    ]
  },
  networks: {
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: "https://polygon-rpc.com/",
      chainId: 137,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  }
};