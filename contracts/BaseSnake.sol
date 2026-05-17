// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BaseSnake
 * @dev Compact on-chain leaderboard contract for Base Mainnet.
 * Submitting high scores requires a minor fee of 0.00001 ETH (~$0.03 USD).
 * Logs a custom builderCode / referral registration string with every run.
 */
contract BaseSnake {
    struct LeaderboardEntry {
        address player;
        string name;
        uint256 score;
        string builderCode;
        uint256 timestamp;
    }

    // Constants
    uint256 public constant ENTRY_FEE = 0.00001 ether; // ~$0.03 USD
    uint256 public constant LEADERBOARD_LIMIT = 10;

    // State Variables
    address public owner;
    LeaderboardEntry[] public leaderboard;

    // Events
    event ScoreSubmitted(
        address indexed player, 
        string name, 
        uint256 score, 
        string builderCode, 
        uint256 timestamp
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Submits a high score to the global leaderboard with a custom builder code.
     * @param name The player's display initials.
     * @param score The score achieved by the player.
     * @param builderCode The custom registration/referral builder string.
     */
    function submitScore(
        string calldata name, 
        uint256 score, 
        string calldata builderCode
    ) external payable {
        require(msg.value >= ENTRY_FEE, "BaseSnake: insufficient entry fee");
        require(score > 0, "BaseSnake: score must be greater than zero");
        require(bytes(name).length > 0 && bytes(name).length <= 16, "BaseSnake: name too long or empty");

        // Insert score into the sorted leaderboard (deduplicates automatically)
        _insertLeaderboard(msg.sender, name, score, builderCode);

        emit ScoreSubmitted(msg.sender, name, score, builderCode, block.timestamp);
    }

    /**
     * @notice Returns the full leaderboard array.
     */
    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return leaderboard;
    }

    /**
     * @dev Internal function to sort, deduplicate, and insert high scores.
     */
    function _insertLeaderboard(
        address player, 
        string calldata name, 
        uint256 score, 
        string calldata builderCode
    ) internal {
        // 1. Check if the player already has an entry on the leaderboard
        int256 existingIndex = -1;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                existingIndex = int256(i);
                break;
            }
        }

        // If player already exists, handle their previous score
        if (existingIndex != -1) {
            uint256 oldScore = leaderboard[uint256(existingIndex)].score;
            if (score <= oldScore) {
                return; // Keep their higher previous score and do nothing
            }
            
            // Remove the old score entry by shifting all elements after it up
            for (uint256 i = uint256(existingIndex); i < leaderboard.length - 1; i++) {
                leaderboard[i] = leaderboard[i + 1];
            }
            leaderboard.pop();
        }

        // 2. Now insert the new score into the sorted array
        LeaderboardEntry memory newEntry = LeaderboardEntry({
            player: player,
            name: name,
            score: score,
            builderCode: builderCode,
            timestamp: block.timestamp
        });

        // If leaderboard is empty, push and return
        if (leaderboard.length == 0) {
            leaderboard.push(newEntry);
            return;
        }

        // Check if leaderboard is full and the score is lower than the lowest score
        if (leaderboard.length >= LEADERBOARD_LIMIT && score <= leaderboard[leaderboard.length - 1].score) {
            return; // Doesn't qualify
        }

        // Find position to insert
        int256 insertIndex = -1;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (score > leaderboard[i].score) {
                insertIndex = int256(i);
                break;
            }
        }

        // Qualifies but goes to the end
        if (insertIndex == -1 && leaderboard.length < LEADERBOARD_LIMIT) {
            leaderboard.push(newEntry);
            return;
        }

        if (insertIndex != -1) {
            // Push a dummy item to expand length if needed
            if (leaderboard.length < LEADERBOARD_LIMIT) {
                leaderboard.push(leaderboard[leaderboard.length - 1]);
            }
            
            // Shift elements down
            for (uint256 i = leaderboard.length - 1; i > uint256(insertIndex); i--) {
                leaderboard[i] = leaderboard[i - 1];
            }
            
            // Place new element
            leaderboard[uint256(insertIndex)] = newEntry;
        }
    }

    /**
     * @notice Reset/Clear all leaderboard entries. Only executable by contract owner.
     */
    function clearLeaderboard() external onlyOwner {
        delete leaderboard;
    }

    /**
     * @notice Withdraw accumulated fees to the owner.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "BaseSnake: balance is zero");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "BaseSnake: transfer failed");
    }

    /**
     * @notice Transfer ownership of the contract.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "BaseSnake: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
