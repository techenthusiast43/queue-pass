const hre = require("hardhat");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying QueuePass to BOT Chain Network...");
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`Target Network: ${network} (Chain ID: ${chainId})`);

  const [deployer] = await hre.ethers.getSigners();
  if (deployer) {
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Deployer Account: ${deployer.address}`);
    console.log(`Deployer Balance: ${hre.ethers.formatEther(balance)} BOT`);
  }

  const QueuePass = await hre.ethers.getContractFactory("QueuePass");
  const queuePass = await QueuePass.deploy();
  await queuePass.waitForDeployment();

  const contractAddress = await queuePass.getAddress();
  console.log("==================================================");
  console.log(`>>> QueuePass successfully deployed at: ${contractAddress}`);
  console.log("==================================================");
  console.log("BOT Chain Explorer URL:");
  if (chainId === 968) {
    console.log(`https://scan.bohr.life/address/${contractAddress}`);
  } else if (chainId === 677) {
    console.log(`https://scan.botchain.ai/address/${contractAddress}`);
  } else {
    console.log(`Local network deployment address: ${contractAddress}`);
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

