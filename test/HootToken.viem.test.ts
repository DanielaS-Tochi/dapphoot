import { createWalletClient, http, getContract } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import { foundry } from 'viem/chains';
import { expect } from 'chai';
import HootTokenArtifact from '../artifacts/contracts/HootToken.sol/HootToken.json';

const LOCAL_URL = "http://127.0.0.1:8545";

describe('HootToken (Viem)', () => {
  let walletClient: any;
  let hootToken: any;
  let admin: `0x${string}`;

  before(async () => {
    walletClient = createWalletClient({
      chain: foundry,
      transport: http(LOCAL_URL),
    });

    const accounts = await walletClient.getAddresses();
    admin = accounts[0];

    // THIS IS THE CORRECT DEPLOYMENT CALL:
    const hash = await walletClient.deployContract({
      abi: HootTokenArtifact.abi,
      bytecode: HootTokenArtifact.bytecode,
      args: [admin],
      account: admin,
    });

    const receipt = await waitForTransactionReceipt(walletClient, { hash });
    const hootTokenAddress = receipt.contractAddress as `0x${string}`;

    hootToken = getContract({
      address: hootTokenAddress,
      abi: HootTokenArtifact.abi,
      client: walletClient,
    });
  });

  it('should assign DEFAULT_ADMIN_ROLE to admin', async () => {
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hasRole = await hootToken.read.hasRole([DEFAULT_ADMIN_ROLE, admin]);
    expect(hasRole).to.equal(true);
  });

  it('MINTER_ROLE can mint tokens', async () => {
    const recipient = admin;
    const amount = 100n * 10n ** 18n;
    const hash = await hootToken.write.mint([recipient, amount], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash });
    const balance = await hootToken.read.balanceOf([recipient]);
    expect(balance).to.equal(amount);
  });

  it('Non-minter cannot mint tokens (should revert)', async () => {
    const accounts = await walletClient.getAddresses();
    const nonMinter = accounts[1];
    const recipient = nonMinter;
    const amount = 100n * 10n ** 18n;
    let errorThrown = false;
    try {
      const hash = await hootToken.write.mint([recipient, amount], { account: nonMinter });
      await waitForTransactionReceipt(walletClient, { hash });
    } catch (err: any) {
      errorThrown = true;
    }
    expect(errorThrown).to.equal(true);
  });

  it('Total supply and balances update after mint', async () => {
    const recipient = admin;
    const amount = 50n * 10n ** 18n;
    const hash = await hootToken.write.mint([recipient, amount], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash });
    const totalSupply = await hootToken.read.totalSupply();
    const balance = await hootToken.read.balanceOf([recipient]);
    expect(totalSupply).to.equal(balance);
  });

  it('Admin can grant MINTER_ROLE to another account', async () => {
    const accounts = await walletClient.getAddresses();
    const newMinter = accounts[1];
    const MINTER_ROLE = await hootToken.read.MINTER_ROLE();
    const hash = await hootToken.write.grantRole([MINTER_ROLE, newMinter], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash });
    const amount = 42n * 10n ** 18n;
    const mintHash = await hootToken.write.mint([newMinter, amount], { account: newMinter });
    await waitForTransactionReceipt(walletClient, { hash: mintHash });
    const balance = await hootToken.read.balanceOf([newMinter]);
    expect(balance).to.equal(amount);
  });

  it('Revoking MINTER_ROLE prevents minting', async () => {
    const accounts = await walletClient.getAddresses();
    const testMinter = accounts[2];
    const MINTER_ROLE = await hootToken.read.MINTER_ROLE();
    let hash = await hootToken.write.grantRole([MINTER_ROLE, testMinter], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash });
    hash = await hootToken.write.revokeRole([MINTER_ROLE, testMinter], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash });
    let errorThrown = false;
    try {
      const mintHash = await hootToken.write.mint([testMinter, 1n * 10n ** 18n], { account: testMinter });
      await waitForTransactionReceipt(walletClient, { hash: mintHash });
    } catch (err: any) {
      errorThrown = true;
    }
    expect(errorThrown).to.equal(true);
  });

  it('Mint emits Transfer event', async () => {
    const recipient = admin;
    const amount = 7n * 10n ** 18n;
    // Mint tokens
    const hash = await hootToken.write.mint([recipient, amount], { account: admin });
    const receipt = await waitForTransactionReceipt(walletClient, { hash });
  
    // ERC20 Transfer event topic
    const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const logs = receipt.logs ?? [];
    const found = logs.some((log: any) => log.topics && log.topics[0] === transferTopic);
  
    expect(found).to.equal(true);
  });
});