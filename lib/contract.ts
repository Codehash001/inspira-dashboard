import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS as string;
const CONTRACT_ABI = [
  // Read methods
  "function getPlanDetails(uint8 _planType) external view returns (uint96 credits, uint80 inspiPrice, uint80 usdtPrice)",
  "function ADDITIONAL_CREDITS() external view returns (uint96)",
  "function ADDITIONAL_CREDITS_INSPI_PRICE() external view returns (uint80)",
  "function ADDITIONAL_CREDITS_USDT_PRICE() external view returns (uint80)",
  "function getUserSubscription(address _user) external view returns (uint8 planType, uint32 subscribedAt, uint32 expiresAt, bool isActive, uint96 credits)",
  "function hasClaimedFree(address) external view returns (bool)",
  // Write methods
  "function claimFreePlan() external",
  "function subscribeWithInspi(uint8 _planType) external",
  "function subscribeWithUSDT(uint8 _planType) external",
  "function unsubscribe() external",
  "function buyAdditionalCreditsWithInspi() external",
  "function buyAdditionalCreditsWithUSDT() external"
];

export async function getContract(withSigner = false) {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not found in environment variables');
  }

  if (typeof window === 'undefined') {
    // Server-side: Use JsonRpcProvider
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }

  // Client-side: Use BrowserProvider with window.ethereum
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}
