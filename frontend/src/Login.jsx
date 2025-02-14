import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

function Login() {
  const navigate = useNavigate();
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    fetch(API_BASE_URL+"/verify-session", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          navigate("/app"); // ✅ Redirect if already logged in
        }
      })
      .catch(() => {}); // No action needed if not logged in
  }, [navigate]);

  useEffect(() => {
    fetch(API_BASE_URL+"/available-accounts", { credentials: "include" })
      .then(res => res.json())
      .then(data => setAvailableAccounts(data))
      .catch(error => console.error("Error fetching accounts:", error));
  }, []);

  const handleLogin = () => {
    if (!selectedAccount) {
      alert("Please select an account");
      return;
    }

    fetch(API_BASE_URL+"/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accountId: selectedAccount }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem("selectedTwitchAccount", selectedAccount);
          navigate("/app"); // Redirect to app
        } else {
          alert(data.message);
        }
      });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Select an available Demo Account to continue</h1>
      <div className="flex flex-col space-y-4">
        {availableAccounts.length > 0 ? (
          availableAccounts.map(account => (
            <button
              key={account.id}
              className={`p-3 w-64 rounded text-center ${
                selectedAccount === account.id ? "bg-blue-500" : "bg-gray-700"
              }`}
              onClick={() => setSelectedAccount(account.id)}
            >
              {account.username}
            </button>
          ))
        ) : (
          <p>No accounts available. Try again later.</p>
        )}
      </div>
      <button onClick={handleLogin} className="mt-6 px-6 py-2 bg-green-500 rounded">
        Login & Continue
      </button>
    </div>
  );
}

export default Login;