// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./HootToken.sol";

contract dAppHoot is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Question {
        string question;
        string[] options;
        bytes32 answerHash;
        bool isActive;
        uint256 reward;
    }

    HootToken public hootToken;
    uint256 public questionCount;
    mapping(uint256 => Question) public questions;
    mapping(address => uint256) public scores;
    address[] public leaderboard;

    event QuestionCreated(uint256 indexed id, string question, string[] options, uint256 reward);
    event AnswerSubmitted(address indexed player, uint256 indexed questionId, bool correct, uint256 reward);
    event LeaderboardUpdated(address indexed player, uint256 newScore);
    event DebugHash(bytes32 expected, bytes32 provided); // Para depuración

    constructor(address _hootToken, address admin) {
        hootToken = HootToken(_hootToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function createQuestion(
        string memory _question,
        string[] memory _options,
        bytes32 _answerHash,
        uint256 _reward
    ) public onlyRole(ADMIN_ROLE) {
        questions[questionCount] = Question(_question, _options, _answerHash, true, _reward);
        emit QuestionCreated(questionCount, _question, _options, _reward);
        questionCount++;
    }
    
    function submitAnswer(uint256 questionId, string memory answer, string memory salt) public {
        Question storage q = questions[questionId];
        require(q.isActive, "Inactive question");
        require(q.reward > 0, "No reward");

        bytes32 hash = keccak256(abi.encodePacked(answer, salt));
        emit DebugHash(q.answerHash, hash); // Emite ambos hashes para comparar en los tests
        bool correct = (hash == q.answerHash);

        if (correct) {
            scores[msg.sender] += q.reward;
            hootToken.mint(msg.sender, q.reward * 1e18);
            updateLeaderboard(msg.sender);
        }
        emit AnswerSubmitted(msg.sender, questionId, correct, q.reward);
    }

    function updateLeaderboard(address player) internal {
        bool found = false;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == player) {
                found = true;
                break;
            }
        }
        if (!found) leaderboard.push(player);
        emit LeaderboardUpdated(player, scores[player]);
    }

    function getLeaderboard() public view returns (address[] memory, uint256[] memory) {
        uint256[] memory points = new uint256[](leaderboard.length);
        for (uint256 i = 0; i < leaderboard.length; i++) {
            points[i] = scores[leaderboard[i]];
        }
        return (leaderboard, points);
    }
}