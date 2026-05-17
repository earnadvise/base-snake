import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'BaseSnake Arcade',
  projectId: '94c5026df21a1b1fbc23f958866bcde6', // Public RainbowKit Cloud project ID
  chains: [base],
});

// The Base Mainnet Smart Contract Address (players will update this after deployment)
export const LEADERBOARD_ADDRESS = '0x0000000000000000000000000000000000000000'; 

/**
 * 💡 CONFIGURE YOUR BUILDER / REFERRAL CODE HERE!
 * Paste your builder registry code or custom developer registration string below.
 * It will automatically be submitted on-chain with every player's high score transaction!
 */
export const BUILDER_CODE = 'bc_v1046vrx';
export const BUILDER_ENCODED = '0x62635f76313034367672780b0080218021802180218021802180218021';

export const LEADERBOARD_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "builderCode",
        "type": "string"
      }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "player",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "score",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "builderCode",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct BaseSnake.LeaderboardEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "builderCode",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ScoreSubmitted",
    "type": "event"
  }
] as const;
