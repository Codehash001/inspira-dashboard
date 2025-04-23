import { ethers } from 'ethers';

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export async function getInspiraBalance(walletAddress: string) {
  try {
    if (!process.env.NEXT_PUBLIC_INSPI_TOKEN_ADDRESS) {
      throw new Error('INSPI token address not configured');
    }

    // Use public RPC URL for Holešky testnet
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
    
    const tokenContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_INSPI_TOKEN_ADDRESS,
      ERC20_ABI,
      provider
    );

    const [rawBalance, decimals] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals()
    ]);

    // Calculate divisor without using ** operator
    let divisor = BigInt(1);
    for(let i = 0; i < decimals; i++) {
      divisor *= BigInt(10);
    }
    
    // Convert to string and then to number for safe division
    const balanceInTokens = Number(rawBalance.toString()) / Number(divisor.toString());
    
    return balanceInTokens;
  } catch (error) {
    console.error('Error fetching INSPI balance:', error);
    return 0;
  }
}
