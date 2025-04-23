'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ethers } from 'ethers'
import { useToast } from '@/hooks/use-toast'
import { 
  Loader2, 
  Settings, 
  CreditCard, 
  Wallet, 
  Gift,
  RefreshCw,
  BadgeDollarSign,
  Coins,
  Users
} from 'lucide-react'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS
const CONTRACT_ABI = [
  "function plans(uint8) view returns (uint96 credits, uint80 inspiPrice, uint80 usdtPrice)",
  "function freeCredits() view returns (uint96)",
  "function ADDITIONAL_CREDITS() view returns (uint96)",
  "function ADDITIONAL_CREDITS_INSPI_PRICE() view returns (uint80)",
  "function ADDITIONAL_CREDITS_USDT_PRICE() view returns (uint80)",
  "function updatePlan(uint8 _planType, uint96 _credits, uint80 _inspiPrice, uint80 _usdtPrice)",
  "function updateFreeCredits(uint96 _newAmount)",
  "function withdrawInspi(uint256 _amount)",
  "function withdrawUSDT(uint256 _amount)",
  "function updateAdditionalCreditsDetails(uint96 _credits, uint80 _inspiPrice, uint80 _usdtPrice)",
  "function changePlanByOwner(address _user, uint8 _planType)",
  "function inspiToken() view returns (address)",
  "function usdtToken() view returns (address)"
]

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
]

enum PlanType {
  Free = 0,
  Pro = 1,
  Ultra = 2
}

export function ContractControls() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string>('1')
  const [userWalletAddress, setUserWalletAddress] = useState('')
  const [userSelectedPlan, setUserSelectedPlan] = useState<string>('1')
  const [giftCreditsAmount, setGiftCreditsAmount] = useState('')
  const [giftWalletAddress, setGiftWalletAddress] = useState('')
  const [planDetails, setPlanDetails] = useState({
    credits: '',
    inspiPrice: '',
    usdtPrice: ''
  })
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [freeCredits, setFreeCredits] = useState('')
  const [additionalCreditsInfo, setAdditionalCreditsInfo] = useState({
    credits: '',
    inspiPrice: '',
    usdtPrice: ''
  })
  const [tokenBalances, setTokenBalances] = useState({
    inspi: '0',
    usdt: '0'
  })

  const getContract = async () => {
    if (!window.ethereum) throw new Error('Please install MetaMask')
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, signer)
  }

  // Fetch current values from contract
  const fetchCurrentValues = async () => {
    try {
      setFetchingData(true)
      
      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Get contract with signer
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, signer)
      
      // Fetch plan details using the plans mapping
      const planType = Number(selectedPlan)
      const plan = await contract.plans(planType)
      
      // Fetch free credits
      const currentFreeCredits = await contract.freeCredits()

      // Fetch additional credits info
      const [additionalCredits, additionalInspiPrice, additionalUsdtPrice] = await Promise.all([
        contract.ADDITIONAL_CREDITS(),
        contract.ADDITIONAL_CREDITS_INSPI_PRICE(),
        contract.ADDITIONAL_CREDITS_USDT_PRICE()
      ])
      
      // Get token addresses from contract
      let inspiTokenAddress: string | undefined
      let usdtTokenAddress: string | undefined
      
      try {
        inspiTokenAddress = await contract.inspiToken()
        usdtTokenAddress = await contract.usdtToken()
        console.log('Token addresses:', { inspiTokenAddress, usdtTokenAddress })
      } catch (error) {
        console.error('Error fetching token addresses:', error)
        toast({
          title: "Warning",
          description: "Could not fetch token addresses. Using default values.",
        })
        // Use default token addresses if contract doesn't have getter functions
        inspiTokenAddress = process.env.NEXT_PUBLIC_INSPI_TOKEN_ADDRESS as string
        usdtTokenAddress = process.env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS as string
      }

      // Set default token balances
      let inspiBalance = BigInt(0)
      let usdtBalance = BigInt(0)
      let inspiDecimals = 18
      let usdtDecimals = 6

      // Fetch token balances if addresses are available
      if (inspiTokenAddress && usdtTokenAddress) {
        try {
          const inspiTokenContract = new ethers.Contract(inspiTokenAddress, ERC20_ABI, provider)
          const usdtTokenContract = new ethers.Contract(usdtTokenAddress, ERC20_ABI, provider)
          
          // Get token balances of the contract
          inspiBalance = await inspiTokenContract.balanceOf(CONTRACT_ADDRESS)
          usdtBalance = await usdtTokenContract.balanceOf(CONTRACT_ADDRESS)
          
          // Get decimals
          inspiDecimals = await inspiTokenContract.decimals()
          usdtDecimals = await usdtTokenContract.decimals()
          
          console.log('Token balances:', {
            inspi: inspiBalance.toString(),
            usdt: usdtBalance.toString(),
            inspiDecimals,
            usdtDecimals
          })
        } catch (error) {
          console.error('Error fetching token balances:', error)
          toast({
            title: "Warning",
            description: "Could not fetch token balances. Using default values.",
          })
        }
      }
      
      setPlanDetails({
        credits: plan.credits.toString(),
        inspiPrice: ethers.formatUnits(plan.inspiPrice, 18),
        usdtPrice: ethers.formatUnits(plan.usdtPrice, 6)
      })
      
      setFreeCredits(currentFreeCredits.toString())

      setAdditionalCreditsInfo({
        credits: additionalCredits.toString(),
        inspiPrice: ethers.formatUnits(additionalInspiPrice, 18),
        usdtPrice: ethers.formatUnits(additionalUsdtPrice, 6)
      })
      
      setTokenBalances({
        inspi: ethers.formatUnits(inspiBalance, inspiDecimals),
        usdt: ethers.formatUnits(usdtBalance, usdtDecimals)
      })
    } catch (error: any) {
      console.error('Error fetching values:', error)
      toast({
        title: "Error",
        description: "Failed to fetch current values: " + error.message,
        variant: "destructive",
      })
    } finally {
      setFetchingData(false)
    }
  }

  // Fetch values when component mounts or plan changes
  useEffect(() => {
    fetchCurrentValues()
  }, [selectedPlan])

  const handleUpdatePlan = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      
      const tx = await contract.updatePlan(
        Number(selectedPlan),
        BigInt(planDetails.credits),
        ethers.parseUnits(planDetails.inspiPrice, 18),
        ethers.parseUnits(planDetails.usdtPrice, 6)
      )
      
      await tx.wait()
      toast({
        title: "Success",
        description: "Plan updated successfully",
      })
      fetchCurrentValues()
    } catch (error: any) {
      console.error('Update plan error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFreeCredits = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      
      const tx = await contract.updateFreeCredits(
        BigInt(freeCredits)
      )
      
      await tx.wait()
      toast({
        title: "Success",
        description: "Free credits updated successfully",
      })
      fetchCurrentValues()
    } catch (error: any) {
      console.error('Update free credits error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAdditionalCredits = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      
      const tx = await contract.updateAdditionalCreditsDetails(
        BigInt(additionalCreditsInfo.credits),
        ethers.parseUnits(additionalCreditsInfo.inspiPrice, 18),
        ethers.parseUnits(additionalCreditsInfo.usdtPrice, 6)
      )
      
      await tx.wait()
      toast({
        title: "Success",
        description: "Additional credits details updated successfully",
      })
      fetchCurrentValues()
    } catch (error: any) {
      console.error('Update additional credits error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (token: 'INSPI' | 'USDT') => {
    try {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount to withdraw",
          variant: "destructive",
        })
        return
      }

      const maxAmount = token === 'INSPI' ? parseFloat(tokenBalances.inspi) : parseFloat(tokenBalances.usdt)
      if (parseFloat(withdrawAmount) > maxAmount) {
        toast({
          title: "Error",
          description: `Withdrawal amount exceeds available balance of ${maxAmount.toFixed(2)} ${token}`,
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      const contract = await getContract()
      
      const decimals = token === 'INSPI' ? 18 : 6
      const amount = ethers.parseUnits(withdrawAmount, decimals)
      
      // Call the specific contract method directly
      let tx;
      if (token === 'INSPI') {
        tx = await contract.withdrawInspi(amount);
      } else {
        tx = await contract.withdrawUSDT(amount);
      }
      
      toast({
        title: "Processing",
        description: `Withdrawing ${withdrawAmount} ${token}. Please wait for transaction confirmation.`,
      })
      
      await tx.wait()
      toast({
        title: "Success",
        description: `${withdrawAmount} ${token} withdrawn successfully to your wallet`,
      })
      setWithdrawAmount('')
      
      // Refresh balances after withdrawal
      fetchCurrentValues()
    } catch (error: any) {
      console.error('Withdraw error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGiftCredits = async () => {
    try {
      if (!ethers.isAddress(giftWalletAddress)) {
        toast({
          title: "Error",
          description: "Please enter a valid wallet address",
          variant: "destructive",
        })
        return
      }

      const credits = parseFloat(giftCreditsAmount)
      if (isNaN(credits) || credits <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid credit amount",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      const normalizedWalletAddress = giftWalletAddress.toLowerCase()
      
      const response = await fetch('/api/admin/gift-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: normalizedWalletAddress,
          credits: credits,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to gift credits')
      }

      toast({
        title: "Success",
        description: `Successfully gifted ${credits} credits to the user`,
      })
      
      setGiftCreditsAmount('')
      setGiftWalletAddress('')
    } catch (error: any) {
      console.error('Gift credits error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlanByOwner = async () => {
    try {
      if (!ethers.isAddress(userWalletAddress)) {
        toast({
          title: "Error",
          description: "Please enter a valid wallet address",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      const contract = await getContract()
      const normalizedWalletAddress = userWalletAddress.toLowerCase()
      
      // First update the smart contract
      const tx = await contract.changePlanByOwner(
        normalizedWalletAddress,
        Number(userSelectedPlan)
      )
      
      await tx.wait()

      // Then update the database
      const response = await fetch('/api/admin/update-user-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: normalizedWalletAddress,
          planType: Number(userSelectedPlan)
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user plan in database')
      }

      toast({
        title: "Success",
        description: "User's plan updated successfully in both smart contract and database",
      })
      setUserWalletAddress('')
    } catch (error: any) {
      console.error('Change plan error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
      {/* Left Column */}
      <div className="space-y-8">
        {/* Plan Update Controls */}
        <Card className="p-8 border border-border shadow-md rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-6 w-6 text-primary dark:text-white" />
            <h3 className="text-xl font-bold">Update Plan</h3>
          </div>
          <div className="space-y-6">
            <Select
              value={selectedPlan}
              onValueChange={setSelectedPlan}
            >
              <SelectTrigger className="border border-border rounded-lg">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border rounded-lg">
                <SelectItem value="1">Pro Plan</SelectItem>
                <SelectItem value="2">Ultra Plan</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="grid gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted dark:text-white" />
                  Credits
                </label>
                <Input
                  type="number"
                  placeholder="Credits"
                  value={planDetails.credits}
                  onChange={(e) => setPlanDetails(prev => ({...prev, credits: e.target.value}))}
                  className="border border-border rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-3">
                  <Coins className="h-5 w-5 text-muted dark:text-white" />
                  INSPI Price
                </label>
                <Input
                  type="number"
                  placeholder="INSPI Price"
                  value={planDetails.inspiPrice}
                  onChange={(e) => setPlanDetails(prev => ({...prev, inspiPrice: e.target.value}))}
                  className="border border-border rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-3">
                  <BadgeDollarSign className="h-5 w-5 text-muted dark:text-white" />
                  USDT Price
                </label>
                <Input
                  type="number"
                  placeholder="USDT Price"
                  value={planDetails.usdtPrice}
                  onChange={(e) => setPlanDetails(prev => ({...prev, usdtPrice: e.target.value}))}
                  className="border border-border rounded-lg"
                />
              </div>
            </div>
            
            <Button 
              className="w-full bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              onClick={handleUpdatePlan}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <RefreshCw className="h-5 w-5 mr-3" />}
              Update Plan
            </Button>
          </div>
        </Card>

        {/* Free Credits Update */}
        <Card className="p-8 border border-border shadow-md rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <Gift className="h-6 w-6 text-primary dark:text-white" />
            <h3 className="text-xl font-bold">Update Free Credits</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted dark:text-white" />
                Free Credits Amount
              </label>
              <Input
                type="number"
                placeholder="New free credits amount"
                value={freeCredits}
                onChange={(e) => setFreeCredits(e.target.value)}
                className="border border-border rounded-lg"
              />
            </div>
            <Button 
              className="w-full bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              onClick={handleUpdateFreeCredits}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <RefreshCw className="h-5 w-5 mr-3" />}
              Update Free Credits
            </Button>
          </div>
        </Card>
                {/* Additional Credits Info */}
                <Card className="p-8 border border-border shadow-md rounded-lg relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-6 w-6 text-primary dark:text-white" />
            <h3 className="text-xl font-bold">Additional Credits Info</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted dark:text-white" />
                Credits Amount
              </label>
              <Input
                type="number"
                placeholder="Credits"
                value={additionalCreditsInfo.credits}
                onChange={(e) => setAdditionalCreditsInfo(prev => ({...prev, credits: e.target.value}))}
                className="border border-border rounded-lg"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <Coins className="h-5 w-5 text-muted dark:text-white" />
                INSPI Price
              </label>
              <Input
                type="number"
                placeholder="INSPI Price"
                value={additionalCreditsInfo.inspiPrice}
                onChange={(e) => setAdditionalCreditsInfo(prev => ({...prev, inspiPrice: e.target.value}))}
                className="border border-border rounded-lg"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <BadgeDollarSign className="h-5 w-5 text-muted dark:text-white" />
                USDT Price
              </label>
              <Input
                type="number"
                placeholder="USDT Price"
                value={additionalCreditsInfo.usdtPrice}
                onChange={(e) => setAdditionalCreditsInfo(prev => ({...prev, usdtPrice: e.target.value}))}
                className="border border-border rounded-lg"
              />
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              onClick={handleUpdateAdditionalCredits}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <RefreshCw className="h-5 w-5 mr-3" />}
              Update Additional Credits
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-8">

        {/* Withdraw Controls */}
        <Card className="p-8 border border-border shadow-md rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="h-6 w-6 text-primary dark:text-white" />
            <h3 className="text-xl font-bold">Withdraw Tokens</h3>
          </div>
          <div className="space-y-6">
            {/* Display token balances */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg border border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">INSPI Balance:</span>
                </div>
                <p className="text-lg font-bold">{parseFloat(tokenBalances.inspi).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">USDT Balance:</span>
                </div>
                <p className="text-lg font-bold">{parseFloat(tokenBalances.usdt).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <BadgeDollarSign className="h-5 w-5 text-muted dark:text-white" />
                Amount to Withdraw
              </label>
              <Input
                type="number"
                placeholder="Amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="border border-border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Button 
                onClick={() => handleWithdraw('INSPI')}
                disabled={loading || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(tokenBalances.inspi)}
                className="bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Coins className="h-5 w-5 mr-3 text-muted dark:text-white" />}
                Withdraw INSPI
              </Button>
              <Button 
                onClick={() => handleWithdraw('USDT')}
                disabled={loading || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(tokenBalances.usdt)}
                className="bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <BadgeDollarSign className="h-5 w-5 mr-3 text-muted dark:text-white" />}
                Withdraw USDT
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <p>* Tokens will be withdrawn to your connected wallet address.</p>
              <p>* The withdrawal amount cannot exceed the available balance.</p>
            </div>
          </div>
        </Card>

        {/* Gift Credits */}
        <Card className="p-8 border border-border shadow-md rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <Gift className="h-6 w-6 text-primary dark:text-white" />
            <h3 className="text-xl font-bold">Gift Credits</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <Wallet className="h-5 w-5 text-muted dark:text-white" />
                Wallet Address
              </label>
              <Input
                type="text"
                placeholder="0x..."
                value={giftWalletAddress}
                onChange={(e) => setGiftWalletAddress(e.target.value)}
                className="border border-border rounded-lg font-mono"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted dark:text-white" />
                Credits Amount
              </label>
              <Input
                type="number"
                placeholder="Credits"
                value={giftCreditsAmount}
                onChange={(e) => setGiftCreditsAmount(e.target.value)}
                className="border border-border rounded-lg"
              />
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              onClick={handleGiftCredits}
              disabled={loading || !giftWalletAddress}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <RefreshCw className="h-5 w-5 mr-3" />}
              Gift Credits
            </Button>
          </div>
        </Card>

        {/* Change User Plan */}
        <Card className="p-8 border border-border shadow-md rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-primary dark:text-white" />
            <h3 className="text-xl font-bold">Change User Plan</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <Wallet className="h-5 w-5 text-muted dark:text-white" />
                User Wallet Address
              </label>
              <Input
                type="text"
                placeholder="0x..."
                value={userWalletAddress}
                onChange={(e) => setUserWalletAddress(e.target.value)}
                className="border border-border rounded-lg font-mono"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted dark:text-white" />
                New Plan
              </label>
              <Select
                value={userSelectedPlan}
                onValueChange={setUserSelectedPlan}
              >
                <SelectTrigger className="border border-border rounded-lg">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border rounded-lg">
                  <SelectItem value="0">Free Plan</SelectItem>
                  <SelectItem value="1">Pro Plan</SelectItem>
                  <SelectItem value="2">Ultra Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              onClick={handleChangePlanByOwner}
              disabled={loading || !userWalletAddress}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <RefreshCw className="h-5 w-5 mr-3" />}
              Change User Plan
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
