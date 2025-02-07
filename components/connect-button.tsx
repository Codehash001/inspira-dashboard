'use client';

import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/use-wallet";
import { Loader2 } from "lucide-react";

export function ConnectButton() {
  const { isConnecting, connect, disconnect, isConnected, address } = useWallet();

  if (isConnecting) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <Button
        onClick={() => disconnect()}
        variant="outline"
        size="sm"
        className="font-mono"
      >
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => connect()}
      variant="outline"
      size="sm"
      className="text-[#00FFD1] border-[#00FFD1] hover:bg-[#00FFD1]/10"
    >
      Connect Wallet
    </Button>
  );
}
