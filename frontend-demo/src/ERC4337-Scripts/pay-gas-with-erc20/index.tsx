import React from "react";
import {
  createZeroDevPaymasterClient,
  createKernelAccountClient,
  getERC20PaymasterApproveCall,
} from "@zerodev/sdk";
import {
  http,
  createPublicClient,
  zeroAddress,
  parseEther,
  createWalletClient,
  custom,
  formatUnits,
  type Log,
} from "viem";
import { baseSepolia, polygonAmoy } from "viem/chains";
import { getEntryPoint } from "@zerodev/sdk/constants";
import { toSafeSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction";
import { useState } from "react";
import { Button, Modal, Spinner, Card, Select, Toast } from "flowbite-react";
import { TOKEN_CONFIG } from "../../Constants/constants";
import { HiCheck } from "react-icons/hi";
import "viem/window";

type GasPrices = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

type EthGetUserOperationGasPriceRpc = {
  ReturnType: GasPrices;
  Parameters: [];
};

const PayWithErc20 = (props: any) => {
  const [estimatedGas, setEstimatedGas] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [actualFees, setActualFees] = useState<string>("");
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [userOpHash, setUserOpHash] = useState<string>("");
  const [selectedToken, setSelectedToken] =
    useState<keyof typeof TOKEN_CONFIG>("USDC");

  const handleModalOpen = async () => {
    setIsEstimating(true);
    try {
      setTransactionHash("");
      setUserOpHash("");
      await EstimateGasFee();
      setOpenModal(true);
    } catch (error) {
      console.error("Error estimating gas:", error);
    } finally {
      setIsEstimating(false);
    }
  };

  const GetAccountConfig = async () => {
    // Define the blockchain network to be used
    const chain = polygonAmoy;

    // Retrieve the gas token address from the configuration based on the selected token
    const gasTokenAddress = TOKEN_CONFIG[selectedToken].address;

    // Request the user's Ethereum account address
    const [address] = await window.ethereum!.request({
      method: "eth_requestAccounts",
    });

    // Create a wallet client for signing transactions
    const signer = createWalletClient({
      account: address,
      chain,
      transport: custom(window.ethereum!),
    });

    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      transport: custom(window.ethereum!),
      chain,
    });

    // Get the entry point contract address for the specified version
    const entryPoint = getEntryPoint("0.7");

    // Create a Safe Smart Account instance
    const account = await toSafeSmartAccount({
      client: publicClient,
      entryPoint: { address: entryPoint07Address, version: "0.7" },
      owners: [signer], // Define account owner(s)
      saltNonce: BigInt(0), // Set the salt nonce for deterministic deployment
      version: "1.4.1",
    });

    // Create a ZeroDev Paymaster client for gas sponsorship
    const paymasterClient: any = createZeroDevPaymasterClient({
      chain,
      transport: http(TOKEN_CONFIG[selectedToken].paymasterUrl),
    });

    // Initialize the Kernel Smart Account Client with bundler and erc20 paymaster support
    const kernelClient: any = createKernelAccountClient({
      account,
      chain,
      bundlerTransport: http(
        `https://api.staging.gelato.digital/bundlers/${chain.id}/rpc`
      ), // Define the Gelato bundler RPC URL
      paymaster: paymasterClient,
      paymasterContext: {
        token: gasTokenAddress, // Specify the token used for gas payments
      },
      userOperation: {
        // Function to estimate gas fees dynamically from the bundler
        estimateFeesPerGas: async ({ bundlerClient }) => {
          const gasPrices =
            await bundlerClient.request<EthGetUserOperationGasPriceRpc>({
              method: "eth_getUserOperationGasPrice",
              params: [],
            });

          console.log("Gas Prices:", gasPrices);

          return {
            maxFeePerGas: BigInt(gasPrices.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrices.maxPriorityFeePerGas),
          };
        },
      },
    });

    // Return the initialized clients and configurations
    return {
      paymasterClient,
      kernelClient,
      account,
      entryPoint,
      publicClient,
      gasTokenAddress,
    };
  };

  const getActualFees = async (
    txHash: string,
    publicClient: any,
    gasTokenAddress: string
  ) => {
    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      // Find Transfer event from the gas token to the paymaster
      const transferEvents = receipt.logs.filter((log: Log) => {
        // Check if this is a Transfer event from the gas token contract
        return (
          log.address.toLowerCase() === gasTokenAddress.toLowerCase() &&
          log.topics[0] ===
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        ); // Transfer event signature
      });

      if (transferEvents.length > 0) {
        // Get the last transfer event which should be the fee payment
        const lastTransferEvent = transferEvents[transferEvents.length - 1];
        const amount = BigInt(lastTransferEvent.data);
        const formattedAmount = formatUnits(
          amount,
          TOKEN_CONFIG[selectedToken].decimals
        );
        return `${formattedAmount} ${TOKEN_CONFIG[selectedToken].symbol}`;
      }
      return "Fee information not available";
    } catch (error) {
      console.error("Error getting actual fees:", error);
      return "Error fetching fee information";
    }
  };

  const main = async () => {
    setIsLoading(true);

    try {
      // Fetch the account configuration, including clients and token details
      const {
        paymasterClient,
        kernelClient,
        account,
        entryPoint,
        publicClient,
        gasTokenAddress,
      } = await GetAccountConfig();

      console.log("Preparing/Sending User Operation...");

      // Prepare and send the user operation (transaction)
      const userOpHash = await kernelClient.sendUserOperation({
        callData: await account.encodeCalls([
          // Approve the paymaster to spend gas tokens
          await (getERC20PaymasterApproveCall as any)(paymasterClient, {
            gasToken: gasTokenAddress,
            approveAmount: parseEther("1"),
            entryPoint,
          }),
          {
            to: zeroAddress, // Dummy transaction to a zero address
            value: BigInt(0), // No ETH transfer
            data: "0x", // Empty data field
          },
        ]),
      });

      console.log("User Op Task Id:", userOpHash);

      // Store the user operation hash in the state
      setUserOpHash(userOpHash);

      console.log("Waiting for transaction receipt...");

      // Wait for the transaction to be confirmed on-chain
      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      // Extract the transaction hash from the receipt
      const txHash = receipt.receipt.transactionHash;
      console.log("User Operation Completed, Transaction Hash:", txHash);

      // Retrieve the actual fees spent on the transaction
      const actualFeesAmount = await getActualFees(
        txHash,
        publicClient,
        gasTokenAddress
      );

      setActualFees(actualFeesAmount);
      setTransactionHash(txHash);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      // Set loading state to false after processing is complete
      setIsLoading(false);
    }
  };

  const EstimateGasFee = async () => {
    try {
      // Fetch the account configuration, including clients and token details
      const {
        paymasterClient,
        kernelClient,
        account,
        entryPoint,
        gasTokenAddress,
      } = await GetAccountConfig();

      // Encode transaction calls for gas estimation
      const callData = await account.encodeCalls([
        // Approve the paymaster to spend the specified amount of gas tokens
        await (getERC20PaymasterApproveCall as any)(paymasterClient, {
          gasToken: gasTokenAddress,
          approveAmount: parseEther("1"),
          entryPoint,
        }),
        {
          to: zeroAddress, // Dummy transaction to a zero address
          value: BigInt(0), // No ETH value transfer
          data: "0x", // Empty transaction data
        },
      ]);

      console.log("Preparing user operation (empty transaction)...");

      // Prepare the user operation with the encoded transaction calls
      const userOp = await kernelClient.prepareUserOperation({ callData });
      console.log("Prepared UserOp:", userOp);

      // Estimate the gas cost in ERC20 tokens using the paymaster client
      const result = await paymasterClient.estimateGasInERC20({
        userOperation: userOp, // Pass the prepared user operation
        gasTokenAddress: gasTokenAddress, // Specify the gas token
        entryPoint: entryPoint07Address, // Use the defined entry point address
      });

      console.log("Estimated Gas:", result);

      // Update the estimated gas value in the UI
      setEstimatedGas(
        `${result.amount} ${TOKEN_CONFIG[selectedToken].symbol} tokens`
      );
    } catch (error) {
      console.error("Error estimating gas:", error);

      // Display an error message if the estimation fails
      setEstimatedGas("Error estimating gas");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 mt-10">
      {showSuccessToast && (
        <Toast className="fixed top-4 right-4 z-50">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff6b6b]/20 text-[#ff6b6b]">
            <HiCheck className="h-5 w-5" />
          </div>
          <div className="ml-3 text-sm font-normal text-white">
            Transaction completed successfully!
          </div>
          <Toast.Toggle />
        </Toast>
      )}

      {openModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40" />
      )}

      <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm border border-[#ff6b6b]/20">
        <div className="p-4">
          <h5 className="text-xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] bg-clip-text text-transparent">
              Select Gas Token
            </span>
          </h5>
          <Select
            id="token"
            value={selectedToken}
            onChange={(e) =>
              setSelectedToken(e.target.value as keyof typeof TOKEN_CONFIG)
            }
            className="bg-black/40 border-[#ff6b6b]/20 text-white"
          >
            {Object.entries(TOKEN_CONFIG).map(([key, token]) => {
              const Icon = token.icon;
              return (
                <option
                  key={key}
                  value={key}
                  className="flex items-center gap-2 bg-black text-white"
                >
                  {token.symbol}
                </option>
              );
            })}
          </Select>

          <div className="flex justify-center mt-6">
            <Button
              className="px-8 py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 relative w-full bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] hover:from-[#ff8585] hover:to-[#ff6b6b] text-white border-none"
              onClick={() => handleModalOpen()}
              disabled={isEstimating || isLoading}
            >
              {isEstimating ? (
                <div className="flex items-center justify-center space-x-2">
                  <Spinner size="sm" className="text-white" />
                  <span>Estimating Gas...</span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Spinner size="sm" className="text-white" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  {React.createElement(TOKEN_CONFIG[selectedToken].icon, {
                    className: "h-5 w-5",
                  })}
                  <span>Send UserOp with {selectedToken}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        show={openModal}
        onClose={() => setOpenModal(false)}
        size="md"
        theme={{
          root: {
            base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full bg-black/60 backdrop-blur-[2px] flex items-center justify-center",
            show: {
              on: "flex bg-black/60 backdrop-blur-[2px]",
              off: "hidden",
            },
          },
          content: {
            base: "relative h-full w-full p-4 md:h-auto",
            inner:
              "relative rounded-lg bg-black border border-[#ff6b6b]/20 shadow-lg shadow-[#ff6b6b]/10 flex flex-col max-h-[90vh]",
          },
        }}
      >
        <Modal.Header className="border-b border-[#ff6b6b]/20 bg-black text-white">
          <span className="text-xl font-bold text-white">
            {transactionHash
              ? "Transaction Status"
              : "Estimated Gas for UserOp"}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-black">
          <div className="space-y-6 p-4">
            <div className="flex flex-col items-center justify-center">
              {transactionHash ? (
                <>
                  <p className="text-lg font-medium text-gray-300 mb-2">
                    Transaction Hash:
                  </p>
                  <p className="text-sm text-[#ff6b6b] break-all mb-4">
                    {transactionHash}
                  </p>
                  <p className="text-lg font-medium text-gray-300 mb-2">
                    Actual Fees Paid:
                  </p>
                  <p className="text-xl font-bold text-[#ff6b6b] mb-4">
                    {actualFees}
                  </p>
                  <div className="flex flex-col gap-4 w-full">
                    <Button
                      className="bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] hover:from-[#ff8585] hover:to-[#ff6b6b] text-white border-none"
                      onClick={() =>
                        window.open(
                          `https://www.oklink.com/amoy/tx/${transactionHash}`,
                          "_blank"
                        )
                      }
                    >
                      View on Explorer
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] hover:from-[#ff8585] hover:to-[#ff6b6b] text-white border-none"
                      onClick={() =>
                        window.open(
                          `https://relay.gelato.digital/tasks/status/${userOpHash}`,
                          "_blank"
                        )
                      }
                    >
                      View Task Status
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-300">
                    Estimated Gas:
                  </p>
                  <p className="text-2xl font-bold text-[#ff6b6b] mt-2">
                    {estimatedGas}
                  </p>
                  {userOpHash && (
                    <Button
                      className="mt-4 bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] hover:from-[#ff8585] hover:to-[#ff6b6b] text-white border-none"
                      onClick={() =>
                        window.open(
                          `https://relay.gelato.digital/tasks/status/${userOpHash}`,
                          "_blank"
                        )
                      }
                    >
                      View Task Status
                    </Button>
                  )}
                </>
              )}
              {isLoading && (
                <div className="mt-4 flex flex-col items-center">
                  <Spinner size="xl" className="text-[#ff6b6b]" />
                  <p className="mt-2 text-sm text-gray-400">
                    Processing transaction...
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-end space-x-4 bg-black border-t border-[#ff6b6b]/20">
          {!transactionHash && (
            <>
              <Button
                className="px-6 bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] hover:from-[#ff8585] hover:to-[#ff6b6b] text-white border-none"
                onClick={() => main()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Spinner size="sm" className="text-white" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Confirm Transaction"
                )}
              </Button>
              <Button
                color="gray"
                onClick={() => setOpenModal(false)}
                className="px-6 hover:bg-[#ff6b6b]/10"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </>
          )}
          {transactionHash && (
            <Button
              color="gray"
              onClick={() => {
                setOpenModal(false);
                setTransactionHash("");
              }}
              className="px-6 hover:bg-[#ff6b6b]/10"
            >
              Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayWithErc20;
