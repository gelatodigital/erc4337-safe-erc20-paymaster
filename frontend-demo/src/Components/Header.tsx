import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Navbar, Dropdown } from "flowbite-react";
import { HiMenuAlt1, HiOutlineLogout, HiOutlineHome } from "react-icons/hi";
import { FaGithub } from "react-icons/fa";
import "viem/window";

const Header = (props: any) => {
  const [account, setAccount] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const truncateWalletAddress = async (address: string, length = 4) => {
    if (!address) return "";
    const start = address.substring(0, length);
    const end = address.substring(address.length - length);
    setAccount(`${start}...${end}`);
  };

  const switchToBaseSepolia = async () => {
    try {
      await window.ethereum!.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x14A34" }], // Base Sepolia chainId in hex
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum!.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x14A34",
                chainName: "Base Sepolia",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Base Sepolia:", addError);
          toast.error("Failed to add Base Sepolia network");
          return false;
        }
      } else {
        console.error("Error switching to Base Sepolia:", switchError);
        toast.error("Failed to switch to Base Sepolia network");
        return false;
      }
    }
  };

  const switchToPolygonAmoy = async () => {
    try {
      await window.ethereum!.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13882" }], // Polygon Amoy chainId in hex (80002)
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum!.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x13882",
                chainName: "Polygon Amoy",
                nativeCurrency: {
                  name: "MATIC",
                  symbol: "MATIC",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc-amoy.polygon.technology/"],
                blockExplorerUrls: ["https://amoy.polygonscan.com/"],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Polygon Amoy:", addError);
          toast.error("Failed to add Polygon Amoy network");
          return false;
        }
      } else {
        console.error("Error switching to Polygon Amoy:", switchError);
        toast.error("Failed to switch to Polygon Amoy network");
        return false;
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask first");
      window.location.href = "https://metamask.io/download/";
      return;
    }
    try {
      const chainSwitched = await switchToPolygonAmoy();
      if (!chainSwitched) return;

      const [address] = await window.ethereum!.request({
        method: "eth_requestAccounts",
      });
      truncateWalletAddress(address);
      props.setSigner(address);
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", address);
      toast.success("Connected successfully");
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
    setAccount("");
    props.setSigner("");
    toast.success("Wallet disconnected");
    window.location.reload();
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      const isConnected = localStorage.getItem("walletConnected") === "true";
      const savedAddress = localStorage.getItem("walletAddress");

      if (isConnected && savedAddress) {
        try {
          // Verify the connection is still valid
          const chainSwitched = await switchToPolygonAmoy();
          if (!chainSwitched) return;
          const accounts = await window.ethereum!.request({
            method: "eth_accounts",
          });

          if (accounts.includes(savedAddress as `0x${string}`)) {
            truncateWalletAddress(savedAddress);
            props.setSigner(savedAddress);
          } else {
            // If the saved address is not in the accounts list, clear the connection
            disconnectWallet();
          }
        } catch (error) {
          console.error("Error checking connection:", error);
          disconnectWallet();
        }
      }
    };

    checkExistingConnection();
  }, []);

  return (
    <Navbar
      fluid
      rounded
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/95 backdrop-blur-md shadow-lg border-b border-[#ff6b6b]/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Navbar.Brand href="/" className="flex items-center space-x-3">
              <img src="/logo.png" className="h-8 w-8 -mr-2" alt="Logo" />
              <span className="text-2xl font-bold bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] bg-clip-text text-transparent">
                Gelato-Bitpanda
              </span>
            </Navbar.Brand>
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-300 hover:text-[#ff6b6b] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <HiOutlineHome className="inline-block mr-1" />
                Home
              </a>
              <a
                href="https://github.com/gelatodigital/erc4337-safe-erc20-paymaster.git"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#ff6b6b] px-3 py-2 pr-8 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <FaGithub className="inline-block mr-1" />
                GitHub
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!account ? (
              <Button
                size="xs"
                className="px-4 py-2 ml-4 text-sm rounded-lg font-medium transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] hover:from-[#ff8585] hover:to-[#ff6b6b] text-white border-none"
                onClick={connectWallet}
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-[#ff6b6b]/20 hover:border-[#ff6b6b]/50 transition-all duration-300">
                  <div className="w-2 h-2 bg-[#ff6b6b] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-200">
                    {account}
                  </span>
                </div>
                <Dropdown
                  label={
                    <Button
                      color="dark"
                      size="xs"
                      className="px-2.5 py-1.5 rounded-lg font-medium transition-all duration-300 hover:bg-[#ff6b6b]/10"
                    >
                      <HiMenuAlt1 className="h-4 w-4" />
                    </Button>
                  }
                  arrowIcon={false}
                  inline
                  className="w-56 bg-black border border-[#ff6b6b]/20"
                >
                  <Dropdown.Header className="border-b border-[#ff6b6b]/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#ff6b6b]/20 flex items-center justify-center">
                        <span className="text-[#ff6b6b] text-sm">
                          {account.substring(2, 4)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-gray-200">
                          {account}
                        </span>
                        <span className="block truncate text-xs font-medium text-[#ff6b6b]">
                          Connected
                        </span>
                      </div>
                    </div>
                  </Dropdown.Header>
                  <Dropdown.Item
                    icon={HiOutlineLogout}
                    className="text-[#ff6b6b] hover:text-[#ff8585] hover:bg-[#ff6b6b]/10 text-sm"
                    onClick={disconnectWallet}
                  >
                    Disconnect
                  </Dropdown.Item>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </Navbar>
  );
};

export default Header;
