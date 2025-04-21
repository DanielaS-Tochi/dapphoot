import { createWalletClient, http, getContract, keccak256 } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import { foundry } from 'viem/chains';
import { expect } from 'chai';
import { encodePacked } from 'viem';
import HootTokenArtifact from '../artifacts/contracts/HootToken.sol/HootToken.json';
import dAppHootArtifact from '../artifacts/contracts/dAppHoot.sol/dAppHoot.json';

const LOCAL_URL = "http://127.0.0.1:8545";

describe('dAppHoot (Viem)', () => {
  let walletClient: any;
  let hootToken: any;
  let dAppHoot: any;
  let admin: `0x${string}`;
  let player: `0x${string}`;

  beforeEach(async () => {
    walletClient = createWalletClient({
      chain: foundry,
      transport: http(LOCAL_URL),
    });
    const accounts = await walletClient.getAddresses();
    admin = accounts[0];
    player = accounts[1];

    // Deploy HootToken
    const tokenHash = await walletClient.deployContract({
      abi: HootTokenArtifact.abi,
      bytecode: HootTokenArtifact.bytecode,
      args: [admin],
      account: admin,
    });
    const tokenReceipt = await waitForTransactionReceipt(walletClient, { hash: tokenHash });
    const hootTokenAddress = tokenReceipt.contractAddress as `0x${string}`;
    hootToken = getContract({
      address: hootTokenAddress,
      abi: HootTokenArtifact.abi,
      client: walletClient,
    });

    // Deploy dAppHoot
    const dappHash = await walletClient.deployContract({
      abi: dAppHootArtifact.abi,
      bytecode: dAppHootArtifact.bytecode,
      args: [hootTokenAddress, admin],
      account: admin,
    });
    const dappReceipt = await waitForTransactionReceipt(walletClient, { hash: dappHash });
    const dAppHootAddress = dappReceipt.contractAddress as `0x${string}`;
    dAppHoot = getContract({
      address: dAppHootAddress,
      abi: dAppHootArtifact.abi,
      client: walletClient,
    });

    // Grant MINTER_ROLE to dAppHoot in HootToken
    const MINTER_ROLE = await hootToken.read.MINTER_ROLE();
    const grantHash = await hootToken.write.grantRole([MINTER_ROLE, dAppHootAddress], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash: grantHash });
  });

  it('should allow only ADMIN_ROLE to create questions', async () => {
    const question = "What is 2+2?";
    const options = ["3", "4", "5"];
    const answer = "4";
    const salt = "secret";
    const answerHash = keccak256(encodePacked(['string', 'string'], [answer, salt]));
    const reward = 10;

    let errorThrown = false;
    try {
      const hash = await dAppHoot.write.createQuestion([question, options, answerHash, reward], { account: admin });
      await waitForTransactionReceipt(walletClient, { hash });
    } catch {
      errorThrown = true;
    }
    expect(errorThrown).to.equal(false);

    // As player: should fail
    errorThrown = false;
    try {
      const hash = await dAppHoot.write.createQuestion([question, options, answerHash, reward], { account: player });
      await waitForTransactionReceipt(walletClient, { hash });
    } catch {
      errorThrown = true;
    }
    expect(errorThrown).to.equal(true);
  });

  it('should reward player for correct answer and update leaderboard', async () => {
    const question = "What is the capital of France?";
    const options = ["Paris", "Berlin", "Rome"];
    const answer = "Paris";
    const salt = "mysalt";
    const reward = 5;
    const answerHash = keccak256(encodePacked(['string', 'string'], [answer, salt]));

    const createHash = await dAppHoot.write.createQuestion([question, options, answerHash, reward], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash: createHash });
    console.log('HASH (TypeScript):', answerHash);

    const submitHash = await dAppHoot.write.submitAnswer([0, answer, salt], { account: player });
    const submitReceipt = await waitForTransactionReceipt(walletClient, { hash: submitHash });

    // Busca el evento DebugHash en los logs del receipt
    const debugLog = submitReceipt.logs.find(
      (log: any) => log.eventName === "DebugHash"
    );

    if (debugLog) {
      console.log('DebugHash EVENT (Solidity):', debugLog);
    };
    // Check player score (on contract)
    const leaderboard = await dAppHoot.read.getLeaderboard();
    console.log('LEADERBOARD:', leaderboard);
    console.log('PLAYER:', player);

    const playerIndex = leaderboard[0].findIndex((addr: string) => addr.toLowerCase() === player.toLowerCase());
    expect(playerIndex).to.not.equal(-1); // player is in leaderboard
    expect(Number(leaderboard[1][playerIndex])).to.equal(reward); // FIX: compare as Number

    const balance = await hootToken.read.balanceOf([player]);
    expect(balance).to.equal(BigInt(reward) * 10n ** 18n);
  });

  it('should NOT reward player for incorrect answer', async () => {
    // Crea una pregunta nueva para este test
    const question = "What is the capital of Italy?";
    const options = ["Rome", "Paris", "Berlin"];
    const answer = "Rome";
    const salt = "mysalt";
    const reward = 7;
    const answerHash = keccak256(encodePacked(['string', 'string'], [answer, salt]));
    const createHash = await dAppHoot.write.createQuestion([question, options, answerHash, reward], { account: admin });
    await waitForTransactionReceipt(walletClient, { hash: createHash });

    const wrongAnswer = "Paris";
    const prevLeaderboard = await dAppHoot.read.getLeaderboard();
    const prevIndex = prevLeaderboard[0].findIndex((addr: string) => addr.toLowerCase() === player.toLowerCase());
    const prevScore = prevIndex !== -1 ? prevLeaderboard[1][prevIndex] : 0;
    const prevBalance = await hootToken.read.balanceOf([player]);

    const submitHash = await dAppHoot.write.submitAnswer([0, wrongAnswer, salt], { account: player });
    await waitForTransactionReceipt(walletClient, { hash: submitHash });

    const leaderboard = await dAppHoot.read.getLeaderboard();
    const index = leaderboard[0].findIndex((addr: string) => addr.toLowerCase() === player.toLowerCase());
    const score = index !== -1 ? leaderboard[1][index] : 0;
    expect(Number(score)).to.equal(Number(prevScore)); // FIX: compare as Number
    const balance = await hootToken.read.balanceOf([player]);
    expect(balance).to.equal(prevBalance);
  });

  it('should create a question and retrieve it', async () => {
    const question = "¿Cuál es la capital de Argentina?";
    const options = ["Buenos Aires", "Córdoba", "Rosario"];
    const answerHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // valor dummy
    const reward = 15;
  
    // Crea la pregunta como admin
    const txHash = await dAppHoot.write.createQuestion([question, options, answerHash, reward], { account: admin });
    const txReceipt = await waitForTransactionReceipt(walletClient, { hash: txHash });
    console.log('createQuestion receipt:', txReceipt);
  
    // Lee la pregunta desde el contrato
    const storedQuestion = await dAppHoot.read.questions([0]);
    console.log('storedQuestion:', storedQuestion);
    expect(storedQuestion[0]).to.equal(question);
    // Opciones: si tienes getter, verifica aquí; si no, omite
    expect(storedQuestion[1]).to.equal(answerHash);
    expect(storedQuestion[2]).to.equal(true);
    expect(Number(storedQuestion[3])).to.equal(reward);
  });

  it('should have an empty leaderboard initially', async () => {
    const leaderboard = await dAppHoot.read.getLeaderboard();
    expect(leaderboard[0].length).to.equal(0);
    expect(leaderboard[1].length).to.equal(0);
  });
});