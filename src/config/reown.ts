import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { base, mainnet } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// Configuração do projeto Reown
export const projectId = process.env.REOWN_PROJECT_ID || process.env.WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
    console.warn('Reown Project ID not configured');
}

// Metadata do projeto
const metadata = {
    name: 'Builder Score Extension',
    description: 'Tip builders directly on GitHub with Builder Score integration',
    url: 'https://github.com/aipop-fun/builder-score-extension',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Networks suportadas
export const networks = [base, mainnet];

// Criar Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: false
});

// Configuração do AppKit
export const appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata,
    features: {
        analytics: false,
        email: false,
        socials: false,
        emailShowWallets: true,
        swaps: false,
        onramp: false
    },
    themeMode: 'light',
    themeVariables: {
        '--w3m-accent': '#8b5cf6',
        '--w3m-color-mix': '#7c3aed',
        '--w3m-color-mix-strength': 20,
        '--w3m-border-radius-master': '12px'
    }
});


export const config = wagmiAdapter.wagmiConfig;


export const TOKENS = {
    WCT: {
        address: '0x...' as `0x${string}`, 
        symbol: 'WCT',
        decimals: 18,
        name: 'WalletConnect Token',
        chainId: base.id
    },
    TALENT: {
        address: '0x9b68bf4bf89c115c721105eaf6bd5164afcc51e4' as `0x${string}`, 
        symbol: 'TALENT',
        decimals: 18,
        name: 'Talent Token',
        chainId: base.id
    }
} as const;

// Contrato do Token Social (Builder.fi style)
export const BUILDER_TOKEN_FACTORY = {
    address: '0x...' as `0x${string}`, // Endereço do factory contract
    chainId: base.id,
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
            name: 'sellShares',
            type: 'function',
            stateMutability: 'nonpayable',
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
            name: 'getSellPrice',
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
        },
        {
            name: 'sharesSupply',
            type: 'function',
            stateMutability: 'view',
            inputs: [
                { name: 'subject', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
        }
    ]
} as const;

// ERC20 Token ABI (para transferências de WCT e TALENT)
export const ERC20_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'account', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    }
] as const;