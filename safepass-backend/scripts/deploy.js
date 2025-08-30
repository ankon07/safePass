"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const unlockTime = currentTimestampInSeconds + 60;
    const lockedAmount = hardhat_1.default.ethers.parseEther("0.001");
    const lock = await hardhat_1.default.ethers.deployContract("Lock", [unlockTime], {
        value: lockedAmount,
    });
    await lock.waitForDeployment();
    console.log(`Lock with ${hardhat_1.default.ethers.formatEther(lockedAmount)} ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
