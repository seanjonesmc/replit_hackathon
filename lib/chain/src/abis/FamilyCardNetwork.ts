// Generated from the compiled FamilyCardNetwork contract by
// contracts/scripts/export-abis.ts. Do not edit; run
// `pnpm run contracts:export-abis` after changing the contract.
export const familyCardNetworkAbi = [
  {
    "inputs": [
      {
        "internalType": "contract MockUSD",
        "name": "token",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "BucketRequired",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "enum FamilyCardNetwork.EngineDecision",
        "name": "engineDecision",
        "type": "uint8"
      },
      {
        "internalType": "enum FamilyCardNetwork.ReasonCode",
        "name": "reasonCode",
        "type": "uint8"
      }
    ],
    "name": "EngineCodeMismatch",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "InsufficientBankBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      },
      {
        "internalType": "enum FamilyCardNetwork.AuthStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "InvalidAuthorizationStatus",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "internalType": "enum FamilyCardNetwork.CardStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "InvalidCardStatus",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      }
    ],
    "name": "InvalidCategory",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "expiryMonth",
        "type": "uint8"
      }
    ],
    "name": "InvalidExpiryMonth",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      }
    ],
    "name": "MerchantAlreadyRegistered",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      }
    ],
    "name": "NoLinkedBank",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "PassAlreadyExpired",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      }
    ],
    "name": "UnknownAuthorization",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      }
    ],
    "name": "UnknownBucket",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "UnknownCard",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "contributionId",
        "type": "uint256"
      }
    ],
    "name": "UnknownContribution",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      }
    ],
    "name": "UnknownMerchant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAmount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "payoutAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "AuthorizationCaptured",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum FamilyCardNetwork.AuthStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum FamilyCardNetwork.ReasonCode",
        "name": "reasonCode",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "AuthorizationCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "parentId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "enum FamilyCardNetwork.AuthStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "AuthorizationResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newBalance",
        "type": "uint256"
      }
    ],
    "name": "BankDeposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "bankName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "last4",
        "type": "string"
      }
    ],
    "name": "BankLinked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
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
        "name": "perTxLimit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "approvalThreshold",
        "type": "uint256"
      }
    ],
    "name": "BucketCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "contributionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "funderId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BucketFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "perTxLimit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "approvalThreshold",
        "type": "uint256"
      }
    ],
    "name": "BucketLimitsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "CardActivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "CardFrozen",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "dependentId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "last4",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "expiryMonth",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "expiryYear",
        "type": "uint16"
      }
    ],
    "name": "CardIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "CardUnfrozen",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "blocked",
        "type": "bool"
      }
    ],
    "name": "CategoryBlocked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "mcc",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "payoutAddress",
        "type": "address"
      }
    ],
    "name": "MerchantRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "TempPassGranted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "activateCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "authorizationCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "enum FamilyCardNetwork.EngineDecision",
        "name": "engineDecision",
        "type": "uint8"
      },
      {
        "internalType": "enum FamilyCardNetwork.ReasonCode",
        "name": "reasonCode",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "authorize",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      }
    ],
    "name": "bankBalanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "bankDeposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bucketCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      }
    ],
    "name": "capture",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cardCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contributionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "perTxLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "approvalThreshold",
        "type": "uint256"
      }
    ],
    "name": "createBucket",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "freezeCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "funderId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "fundBucket",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "contributionId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      }
    ],
    "name": "getAuthorization",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "cardId",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "merchantId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "bucketId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "enum FamilyCardNetwork.AuthStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum FamilyCardNetwork.ReasonCode",
            "name": "reasonCode",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "reason",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct FamilyCardNetwork.Authorization",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      }
    ],
    "name": "getBucket",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "perTxLimit",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "approvalThreshold",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "available",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "held",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "spent",
            "type": "uint256"
          }
        ],
        "internalType": "struct FamilyCardNetwork.Bucket",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "getCard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "dependentId",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "last4",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "expiryMonth",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "expiryYear",
            "type": "uint16"
          },
          {
            "internalType": "enum FamilyCardNetwork.CardStatus",
            "name": "status",
            "type": "uint8"
          }
        ],
        "internalType": "struct FamilyCardNetwork.Card",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "contributionId",
        "type": "uint256"
      }
    ],
    "name": "getContribution",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "funderId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "bucketId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct FamilyCardNetwork.Contribution",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      }
    ],
    "name": "getMerchant",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint16",
            "name": "mcc",
            "type": "uint16"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "payoutAddress",
            "type": "address"
          }
        ],
        "internalType": "struct FamilyCardNetwork.Merchant",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "maxAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "grantTemporaryPass",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      }
    ],
    "name": "hasLinkedBank",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      }
    ],
    "name": "isCategoryBlocked",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      }
    ],
    "name": "isMerchantRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "dependentId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "last4",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "expiryMonth",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "expiryYear",
        "type": "uint16"
      }
    ],
    "name": "issueCard",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "bankName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "last4",
        "type": "string"
      }
    ],
    "name": "linkBankAccount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "merchantId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint16",
        "name": "mcc",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "payoutAddress",
        "type": "address"
      }
    ],
    "name": "registerMerchant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "authId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      },
      {
        "internalType": "bytes32",
        "name": "parentId",
        "type": "bytes32"
      }
    ],
    "name": "resolvePending",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "blocked",
        "type": "bool"
      }
    ],
    "name": "setBlockedCategory",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bucketId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "perTxLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "approvalThreshold",
        "type": "uint256"
      }
    ],
    "name": "setBucketLimits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tusd",
    "outputs": [
      {
        "internalType": "contract MockUSD",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      }
    ],
    "name": "unfreezeCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
