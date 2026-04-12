import { useEffect, useState } from "react";
import { SignInButton } from "@clerk/clerk-react";

export const LoginPage = () => {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1220] to-[#0F172A] m-0 absolute inset-0 z-50">
      {!showLogin ? (
        // Splash Screen
        <div className="text-center animate-fade-in">
          <img
            src="/novameet-logo.png"
            alt="NovaMeet"
            className="w-40 mx-auto mb-6"
          />

          <h1 className="text-3xl font-semibold text-white mb-2">
            NovaMeet
          </h1>

          <p className="text-gray-400">
            AI Meeting Assistant
          </p>

          <div className="mt-6 w-40 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-blue-500 animate-loading" />
          </div>
        </div>
      ) : (
        // Login Button
        <div className="text-center animate-fade-in">
          <img
            src="/novameet-logo.png"
            alt="NovaMeet"
            className="w-32 mx-auto mb-6"
          />

          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              Authenticate Now
            </button>
          </SignInButton>
        </div>
      )}
    </div>
  );
};
