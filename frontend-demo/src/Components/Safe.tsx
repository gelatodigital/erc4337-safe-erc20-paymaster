import { Button, Card, Clipboard, Spinner } from "flowbite-react";
import { toSafeSmartAccount } from "permissionless/accounts";
import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  parseAbi,
} from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { polygonAmoy } from "viem/chains";
import { toast } from "react-toastify";
import { usdcAddress } from "../Constants/constants";
import { FiRefreshCcw } from "react-icons/fi";

const Safe = (props: any) => {
  const chain = polygonAmoy;
  const publicClient: any = createPublicClient({
    transport: custom(window.ethereum!),
    chain,
  });
  const [safeAddress, setSafeAddress] = useState<string>("");
  const [usdcBalance, setUsdcBalance] = useState<string>("");
  const [nativeBalance, setNativeBalance] = useState<string>("");
  const [computed, setComputed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const computeAddress = async () => {
    if (!props.signer) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const signer = createWalletClient({
        account: props.signer as `0x${string}`,
        chain,
        transport: custom(window.ethereum!),
      });

      const account = await toSafeSmartAccount({
        client: publicClient,
        entryPoint: { address: entryPoint07Address, version: "0.7" },
        owners: [signer.account],
        saltNonce: BigInt(0),
        version: "1.4.1",
      });

      setSafeAddress(account.address);
      console.log("Safe Account Address:", account.address);

      try {
        const usdcBalance = await publicClient.readContract({
          abi: (parseAbi as any)([
            "function balanceOf(address account) returns (uint256)",
          ]),
          address: usdcAddress,
          functionName: "balanceOf",
          args: [account.address],
        });
        const balance = `${Number(usdcBalance) / 1_000_000} USDC`;
        setUsdcBalance(balance);
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
        setUsdcBalance("0 USDC");
        toast.error("Failed to fetch USDC balance");
      }

      try {
        const kernelBalance = await publicClient.getBalance({
          address: account.address,
        });
        const formattedBalance = Number(formatEther(kernelBalance)).toFixed(6);
        console.log("Current balance:", formattedBalance, "ETH");
        setNativeBalance(`${formattedBalance} ETH`);
      } catch (error) {
        console.error("Error fetching ETH balance:", error);
        setNativeBalance("0 ETH");
        toast.error("Failed to fetch ETH balance");
      }

      setComputed(true);
      toast.success("Safe address computed successfully");
    } catch (error) {
      console.error("Error computing safe address:", error);
      toast.error("Failed to compute safe address");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center mt-10">
      <Card className="w-full max-w-2xl p-8 bg-black/50 backdrop-blur-sm shadow-xl rounded-xl border border-[#ff6b6b]/20">
        <h5 className="mb-6 text-3xl font-bold text-center">
          <span className="bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] bg-clip-text text-transparent">
            Safe Account Address
          </span>
        </h5>
        {computed && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-black/40 border border-[#ff6b6b]/10">
              <div className="relative">
                <label htmlFor="safe-address" className="sr-only">
                  Safe Address
                </label>
                <input
                  id="safe-address"
                  type="text"
                  className="w-full rounded-lg border bg-black/40 px-4 py-3 text-sm text-gray-300 border-[#ff6b6b]/20 focus:border-[#ff6b6b] focus:ring-[#ff6b6b]"
                  value={safeAddress}
                  disabled
                  readOnly
                />
                <Clipboard.WithIconText
                  valueToCopy={safeAddress}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ff6b6b] hover:text-[#ff8585]"
                />
              </div>
              <p className="mt-1.5 ml-2 text-xs font-normal text-gray-400 flex items-center">
                <svg
                  className="w-3.5 h-3.5 mr-1.5 text-[#ff6b6b]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Copy safe address and claim 10 USDC faucet tokens on Polygon
                Amoy{" "}
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ff6b6b] hover:text-[#ff8585] underline ml-1"
                >
                  here
                </a>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-black/40 to-[#ff6b6b]/5 border border-[#ff6b6b]/10">
                <p className="text-sm font-medium text-gray-400">
                  USDC Balance
                </p>
                <p className="text-2xl font-bold text-[#ff6b6b] flex items-center gap-2">
                  {usdcBalance}
                  <button
                    onClick={computeAddress}
                    className="p-1 rounded transition"
                  >
                    <FiRefreshCcw size={20} />
                  </button>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-black/40 to-[#ff6b6b]/5 border border-[#ff6b6b]/10">
                <p className="text-sm font-medium text-gray-400">
                  Native Balance
                </p>
                <p className="text-2xl font-bold text-[#ff6b6b]">
                  {nativeBalance}
                </p>
              </div>
            </div>
          </div>
        )}
        <Button
          className="w-full mt-6 font-semibold bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] hover:from-[#ff8585] hover:to-[#ff6b6b] border-none text-white transition-all duration-300"
          size="lg"
          onClick={computeAddress}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Spinner size="sm" className="text-white" />
              <span>Computing...</span>
            </div>
          ) : (
            "Compute Address"
          )}
        </Button>
      </Card>
    </div>
  );
};

export default Safe;
