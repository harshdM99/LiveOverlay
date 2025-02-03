import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Pre-configured Twitch accounts
  const twitchAccounts = [
    { username: "TwitchUser1", id: "twitch_1" },
    { username: "TwitchUser2", id: "twitch_2" },
    { username: "TwitchUser3", id: "twitch_3" }
  ];

  // Handle login selection
  const handleLogin = () => {
    if (selectedAccount) {
      localStorage.setItem("selectedTwitchAccount", selectedAccount);
      navigate("/app"); // Redirect to the main app
    } else {
      alert("Please select an account");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Select an available Demo Account to continue</h1>
      <div className="flex flex-col space-y-4">
        {twitchAccounts.map((account) => (
          <button
            key={account.id}
            className={`p-3 w-64 rounded text-center ${
              selectedAccount === account.id ? "bg-blue-500" : "bg-gray-700"
            }`}
            onClick={() => setSelectedAccount(account.id)}
          >
            {account.username}
          </button>
        ))}
      </div>
      <button onClick={handleLogin} className="mt-6 px-6 py-2 bg-green-500 rounded">
        Login & Continue
      </button>
    </div>
  );
}

export default Login;
