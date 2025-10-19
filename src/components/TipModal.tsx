import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { base } from 'viem/chains';
import { TOKENS, BUILDER_TOKEN_FACTORY } from '@/config/web3';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface TipModalProps {
  githubUsername: string;
  walletAddress?: string;
  passportData?: {
    displayName: string;
    imageUrl: string;
    score: number;
  };
  onClose: () => void;
}

type TipType = 'eth' | 'wct' | 'talent' | 'social';

export const TipModal: React.FC<TipModalProps> = ({
  githubUsername,
  walletAddress,
  passportData,
  onClose
}) => {
  const [tipType, setTipType] = useState<TipType>('eth');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address, chainId: base.id });
  
  // Para tokens sociais - buscar preço
  const { data: socialTokenPrice } = useReadContract({
    address: BUILDER_TOKEN_FACTORY.address,
    abi: BUILDER_TOKEN_FACTORY.abi,
    functionName: 'getBuyPrice',
    args: walletAddress ? [walletAddress as `0x${string}`, BigInt(1)] : undefined,
    chainId: base.id,
  });

  // Para tokens sociais - buscar balance do holder
  const { data: socialTokenBalance } = useReadContract({
    address: BUILDER_TOKEN_FACTORY.address,
    abi: BUILDER_TOKEN_FACTORY.abi,
    functionName: 'getSharesBalance',
    args: walletAddress && address ? [walletAddress as `0x${string}`, address] : undefined,
    chainId: base.id,
  });

  const { writeContract, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      setIsProcessing(false);
      // Mostrar notificação de sucesso
      setTimeout(() => onClose(), 2000);
    }
  }, [isConfirmed, onClose]);

  const handleTip = async () => {
    if (!address || !walletAddress || !amount) return;
    
    setIsProcessing(true);
    
    try {
      if (tipType === 'eth') {
        // Enviar ETH direto
        await writeContract({
          to: walletAddress as `0x${string}`,
          value: parseEther(amount),
          chainId: base.id,
        });
      } else if (tipType === 'social') {
        // Comprar tokens sociais
        const price = socialTokenPrice || BigInt(0);
        await writeContract({
          address: BUILDER_TOKEN_FACTORY.address,
          abi: BUILDER_TOKEN_FACTORY.abi,
          functionName: 'buyShares',
          args: [walletAddress as `0x${string}`, BigInt(amount)],
          value: price,
          chainId: base.id,
        });
      } else {
        // Enviar tokens ERC20 (WCT ou TALENT)
        const tokenAddress = tipType === 'wct' ? TOKENS.WCT.address : TOKENS.TALENT.address;
        const decimals = tipType === 'wct' ? TOKENS.WCT.decimals : TOKENS.TALENT.decimals;
        
        await writeContract({
          address: tokenAddress,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'transfer',
          args: [walletAddress as `0x${string}`, parseEther(amount)],
          chainId: base.id,
        });
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      setIsProcessing(false);
    }
  };

  const getTipTypeLabel = () => {
    switch (tipType) {
      case 'eth': return 'ETH';
      case 'wct': return 'WCT';
      case 'talent': return 'TALENT';
      case 'social': return 'Social Tokens';
    }
  };

  const getSuggestedAmounts = () => {
    switch (tipType) {
      case 'eth': return ['0.001', '0.005', '0.01', '0.05'];
      case 'wct': 
      case 'talent': return ['1', '5', '10', '50'];
      case 'social': return ['1', '2', '5', '10'];
    }
  };

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to tip @{githubUsername}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <w3m-button />
            <p className="text-sm text-muted-foreground text-center">
              You need to connect your wallet to send tips
            </p>
          </CardContent>
          <CardFooter>
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Wallet Not Found</CardTitle>
            <CardDescription>
              @{githubUsername} hasn't connected their wallet yet
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              This user needs to link their wallet address to their Talent Protocol profile to receive tips.
            </p>
          </CardContent>
          <CardFooter>
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-3">
            {passportData?.imageUrl && (
              <img
                src={passportData.imageUrl}
                alt={githubUsername}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <CardTitle>Tip @{githubUsername}</CardTitle>
              <CardDescription>
                {passportData?.displayName || githubUsername}
                {passportData?.score && (
                  <span className="ml-2 text-purple-600 font-semibold">
                    Score: {passportData.score}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Seletor de tipo de tip */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Asset</label>
            <div className="grid grid-cols-4 gap-2">
              {(['eth', 'wct', 'talent', 'social'] as TipType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTipType(type)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    tipType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {type === 'eth' ? 'ETH' : type === 'wct' ? 'WCT' : type === 'talent' ? 'TALENT' : 'Social'}
                </button>
              ))}
            </div>
          </div>

          {/* Input de quantidade */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount ({getTipTypeLabel()})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          {/* Valores sugeridos */}
          <div className="flex space-x-2">
            {getSuggestedAmounts().map((suggested) => (
              <button
                key={suggested}
                onClick={() => setAmount(suggested)}
                className="flex-1 py-1 px-2 text-sm bg-purple-100 hover:bg-purple-200 rounded transition-colors"
              >
                {suggested}
              </button>
            ))}
          </div>

          {/* Info sobre tokens sociais */}
          {tipType === 'social' && socialTokenPrice && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium">Price per token:</p>
              <p className="text-blue-700">
                {formatEther(socialTokenPrice)} ETH
              </p>
              {socialTokenBalance && (
                <p className="mt-2 text-gray-600">
                  You hold: {socialTokenBalance.toString()} tokens
                </p>
              )}
            </div>
          )}

          {/* Balance do usuário */}
          {balance && (
            <div className="text-sm text-gray-600">
              Your balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </div>
          )}

          {/* Status da transação */}
          {isConfirming && (
            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
              Confirming transaction...
            </div>
          )}
          
          {isConfirmed && (
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
              Tip sent successfully! 🎉
            </div>
          )}
        </CardContent>

        <CardFooter className="flex space-x-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTip}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Send ${getTipTypeLabel()}`}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};