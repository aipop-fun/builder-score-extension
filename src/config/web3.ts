import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base, mainnet } from 'viem/chains';

// Configuração do projeto WalletConnect
export const projectId = process.env.WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('WalletConnect Project ID not configured');
}

// Metadata do projeto
const metadata = {
  name: 'Builder Score Extension',
  description: 'Tip builders directly on GitHub',
  url: 'https://github.com/aipop-fun/builder-score-extension',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Chains suportadas
const chains = [base, mainnet] as const;

// Configuração do Wagmi
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});

// Tokens suportados
export const TOKENS = {
  WCT: {
    address: '0x...' as `0x${string}`, // Endereço do token WCT na Base
    symbol: 'WCT',
    decimals: 18,
    name: 'WalletConnect Token'
  },
  TALENT: {
    address: '0x...' as `0x${string}`, // Endereço do token TALENT na Base
    symbol: 'TALENT',
    decimals: 18,
    name: 'Talent Token'
  }
} as const;

// Contrato do Token Social (Builder.fi style)
export const BUILDER_TOKEN_FACTORY = {
  address: '0x...' as `0x${string}`, // Endereço do factory contract
  abi: [
    {
      name: 'buyShares',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'subject', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: []
    },
    {
      name: 'getBuyPrice',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'subject', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'uint256' }]
    },
    {
      name: 'getSharesBalance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'subject', type: 'address' },
        { name: 'holder', type: 'address' }
      ],
      outputs: [{ name: '', type: 'uint256' }]
    }
  ]
} as const;