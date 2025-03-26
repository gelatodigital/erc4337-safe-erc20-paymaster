# ERC4337-Safe-ERC20-Paymaster

This project demonstrates how to obtain a **counterfactual Safe smart account address** without deploying it and how these accounts can be used to **pay gas fees using ERC-20 tokens** such as **USDC, USDT**. The implementation leverages the **Gelato Bundler** and **ZeroDev SDK**.

## 🚀 Features

- Counterfactual Smart Accounts using Safe
- Paying Gas using ERC-20 tokens
- Integration with Gelato Bundler & ZeroDev SDK
- Works on **Polygon Amoy** (configurable for other networks)

## 🛠 Setup & Installation

### 1️⃣ Create a ZeroDev Project

- Go to the **[ZeroDev Dashboard](https://dashboard.zerodev.app/)**.
- Create a new project on **Polygon Amoy**.
- Copy the **Project ID** and add it to `frontend/src/Constants/constants.ts`.
- If you want to use a different network, update the **token addresses** accordingly in `constants.ts`.

### 2️⃣ Configure ERC-20 Paymaster (Optional)

- On **testnets**, only **Circle USDC** is officially supported by ZeroDev.
- To test with different ERC-20 tokens:
  - Navigate to **Self-Funded Paymasters** on the **ZeroDev Dashboard**.
  - Deploy a custom ERC-20 Paymaster.
  - Deposit some funds into the paymaster.
  - Set up the **exchange rate** for the ERC-20 tokens you want to support.
- On **mainnets**, several ERC-20 tokens are available for gas payments.

### 3️⃣ Install Dependencies

```sh
npm install
```

### 4️⃣ Run the Local Server

```sh
cd frontend/
npm start
```

## 🔥 Interacting with the Demo

1. **Connect Wallet** to the website.
2. **Compute Safe Address** (counterfactual smart account).
3. **Get Some Faucet Funds** for the Safe smart account.
4. **Send UserOps** to execute gasless transactions.

## 📝 Notes

- Ensure you have enough ERC-20 tokens in your Safe smart account for gas payments.
- For **custom paymasters**, make sure to deposit sufficient funds and configure exchange rates correctly.

Happy building! 🚀
