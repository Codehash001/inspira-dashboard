import useSWR from "swr";
import { useWallet } from "@/lib/use-wallet";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface User {
  walletId: string;
  username: string | null;
  createdAt: string;
  plan: string | null;
}

export const useUser = () => {
  const { address } = useWallet();
  
  const { data: user, error, mutate } = useSWR<User>(
    address ? `/api/user/${address}` : null,
    fetcher
  );

  return {
    user,
    isLoading: !error && !user,
    isError: error,
    mutateUser: mutate,
  };
};
