import React, { useState } from "react";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import Header from "./Components/Header";
import Safe from "./Components/Safe";
import PayWithErc20 from "./ERC4337-Scripts/pay-gas-with-erc20";

function App() {
  const [signer, setSigner] = useState<string>("");
  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff6b6b]/10 via-[#ff6b6b]/5 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ff6b6b]/10 via-transparent to-transparent pointer-events-none opacity-50"></div>
      <Header setSigner={setSigner} />
      <main className="container mx-auto px-4 pt-24 pb-12 relative">
        <div className="space-y-12">
          <Safe signer={signer} />
          <PayWithErc20 signer={signer} />
        </div>
      </main>
    </div>
  );
}

export default App;
