import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/api";
import feather from "feather-icons";

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        feather.replace();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await signup({ name, email, password });
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950 p-4 animate-gradient-flow">
            <div className="bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-lg p-8 sm:p-10 rounded-3xl shadow-[0_0_25px_rgba(0,0,255,0.4)] border border-blue-900/40 w-full max-w-md mx-auto transform transition-all hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(0,115,255,0.6)] duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-full bg-blue-900/40 backdrop-blur-md border border-blue-700/50 shadow-[0_0_20px_rgba(0,123,255,0.5)] animate-pulse-slow">
                        <i data-feather="user-plus" className="w-8 h-8 text-blue-400"></i>
                    </div>
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,0,255,0.3)]">
                        SplitSmart
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm tracking-wide">
                        Sign up and step into the future of smart expense sharing
                    </p>
                </div>

                {error && (
                    <p className="text-red-400 mb-4 text-center bg-red-900/20 p-3 rounded-lg border border-red-700/40 animate-fade-in">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full p-4 bg-black/60 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 text-white placeholder-gray-500 transition-all duration-300 shadow-inner"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full p-4 bg-black/60 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 text-white placeholder-gray-500 transition-all duration-300 shadow-inner"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-4 bg-black/60 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 text-white placeholder-gray-500 transition-all duration-300 shadow-inner"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-xl text-white font-semibold tracking-wide shadow-[0_0_20px_rgba(0,115,255,0.6)] hover:shadow-[0_0_40px_rgba(0,115,255,0.9)] hover:from-blue-800 hover:to-blue-600 transition-all duration-500 transform hover:-translate-y-1 flex items-center justify-center"
                    >
                        <i data-feather="user-plus" className="w-5 h-5 mr-2"></i> Sign Up
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="text-blue-400 hover:text-blue-300 font-semibold transition-all duration-300"
                    >
                        Login here
                    </a>
                </p>
            </div>

            <style jsx>{`
        @keyframes gradient-flow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-flow {
          background-size: 300% 300%;
          animation: gradient-flow 12s ease infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(0, 123, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 35px rgba(0, 123, 255, 0.8);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default Signup;
