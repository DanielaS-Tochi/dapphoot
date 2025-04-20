import { createWalletClient, http, getContract } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions'; // <-- Add this import
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

    const hash = await walletClient.deployContract({
      abi: HootTokenArtifact.abi,
      bytecode: HootTokenArtifact.bytecode,
      args: [admin],
      account: admin,
    });

    // CORRECT: Use the standalone function
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
});