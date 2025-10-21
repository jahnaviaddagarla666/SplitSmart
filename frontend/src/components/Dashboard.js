import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScenarioInput from './ScenarioInput';
import Analytics from './Analytics';
import History from './History';
import { createScenario, getScenarios, deleteScenario } from '../api/api';
import feather from 'feather-icons';

const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    INR: '₹',
};

const getSymbol = (currency) => CURRENCY_SYMBOLS[currency] || currency;

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [scenarios, setScenarios] = useState([]);
    const [currentScenario, setCurrentScenario] = useState(null);
    const [showInput, setShowInput] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        feather.replace();
    }, [showInput, showAnalytics, showHistory]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        loadScenarios(token);
    }, [navigate]);

    const loadScenarios = async (token) => {
        try {
            const { data } = await getScenarios(token);
            setScenarios(data);
            if (data.length > 0) setCurrentScenario(data[0]);
        } catch (err) {
            console.error('Error loading scenarios:', err);
        }
    };

    const handleCreate = async (data) => {
        const token = localStorage.getItem('token');
        setSubmitError('');
        try {
            const response = await createScenario(data, token);
            const newScenarios = Array.isArray(response.data) ? response.data : [response.data];
            setScenarios((prev) => [...newScenarios, ...prev]);
            setCurrentScenario(newScenarios[0]);
            setShowInput(false);
        } catch (err) {
            console.error('Error creating scenarios:', err);
            setSubmitError(err.response?.data?.error || 'Failed to create scenario.');
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await deleteScenario(id, token);
            setScenarios(scenarios.filter((s) => s._id !== id));
            if (currentScenario && currentScenario._id === id) {
                setCurrentScenario(scenarios[1] || null);
            }
        } catch (err) {
            console.error('Error deleting scenario:', err);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user)
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-950 text-white text-xl">
                Loading SplitSmart...
            </div>
        );

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-950 text-white animate-gradient-flow">
                {/* NAVIGATION */}
                <nav className="bg-black/70 backdrop-blur-xl border-b border-blue-900/40 shadow-[0_0_25px_rgba(0,115,255,0.3)] sticky top-0 z-50 p-4 flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,115,255,0.5)]">
                        SplitSmart
                    </h1>
                    <div className="flex flex-wrap justify-center gap-3 mt-3 sm:mt-0">
                        <button
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(0,115,255,0.6)] transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            <i data-feather="bar-chart" className="w-4 h-4"></i>
                            {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
                        </button>

                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(0,115,255,0.6)] transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            <i data-feather="archive" className="w-4 h-4"></i>
                            {showHistory ? 'Hide History' : 'History'}
                        </button>

                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-700 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,0,80,0.6)] transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            <i data-feather="log-out" className="w-4 h-4"></i>
                            Logout
                        </button>
                    </div>
                </nav>

                {/* HEADER */}
                <header className="text-center py-12 animate-fade-in-up">
                    <h2 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,115,255,0.5)] mt-12 mb-6 px-8 py-4 rounded-2xl tracking-wide">
                        Welcome, {user.name} 👋
                    </h2>
                    <p className="text-gray-300 text-lg font-light">
                        Manage, split, and visualize your expenses effortlessly with AI assistance.
                    </p>
                </header>

                {/* MAIN CONTENT */}
                <main className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* SCENARIO DETAILS */}
                        <div className="lg:col-span-2 bg-black/50 backdrop-blur-xl rounded-3xl p-6 border border-blue-900/30 shadow-[0_0_30px_rgba(0,115,255,0.2)] animate-slide-in-right">
                            {currentScenario ? (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-900/40 border border-blue-800/40">
                                                <i data-feather="trending-up" className="w-6 h-6 text-blue-400"></i>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-blue-400">{currentScenario.category}</h3>
                                                <p className="text-gray-400 text-sm">
                                                    {new Date(currentScenario.date).toLocaleDateString()} • {currentScenario.currency}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setCurrentScenario(null)}
                                            className="p-2 rounded-full bg-blue-900/40 hover:bg-blue-800/50 transition"
                                        >
                                            <i data-feather="minimize-2" className="w-4 h-4 text-blue-300"></i>
                                        </button>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                        <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
                                            <p className="text-sm text-gray-400">Total Expenses</p>
                                            <p className="text-2xl font-bold">{getSymbol(currentScenario.currency)}{currentScenario.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</p>
                                        </div>
                                        <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
                                            <p className="text-sm text-gray-400">Avg Balance</p>
                                            <p className="text-2xl font-bold">{getSymbol(currentScenario.currency)}{(currentScenario.balances.reduce((s, b) => s + b.balance, 0) / (currentScenario.balances.length || 1)).toFixed(2)}</p>
                                        </div>
                                        <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
                                            <p className="text-sm text-gray-400">Settlements</p>
                                            <p className="text-2xl font-bold">{currentScenario.settlements.length}</p>
                                        </div>
                                    </div>

                                    {/* Settlements */}
                                    <div className="space-y-3">
                                        {currentScenario.settlements.slice(0, 3).map((s, i) => (
                                            <div key={i} className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl flex justify-between items-center">
                                                <span className="text-gray-300 text-sm">{s.from} → {s.to}</span>
                                                <span className="font-semibold text-blue-300">{getSymbol(s.currency || currentScenario.currency)}{s.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <i data-feather="zap" className="w-14 h-14 text-blue-400 mx-auto mb-4"></i>
                                    <h3 className="text-2xl font-bold text-white">No Active Scenario</h3>
                                    <p className="text-gray-400">Tap the + button to add your first expense split</p>
                                </div>
                            )}
                        </div>

                        {/* QUICK STATS */}
                        <div className="bg-black/50 backdrop-blur-xl p-6 rounded-3xl border border-blue-900/30 shadow-[0_0_25px_rgba(0,115,255,0.2)] animate-slide-in-left">
                            <h4 className="text-lg font-semibold mb-4 text-blue-300">Quick Stats</h4>
                            <div className="space-y-3 text-gray-300">
                                <div className="flex justify-between">
                                    <span>Total Scenarios</span>
                                    <span className="font-bold text-blue-400">{scenarios.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Expense</span>
                                    <span className="font-bold text-blue-400">
                                        ₹
                                        {(
                                            scenarios.reduce(
                                                (sum, s) =>
                                                    sum + s.expenses.reduce((eSum, e) => eSum + e.amount, 0),
                                                0
                                            ) / (scenarios.length || 1)
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FLOATING BUTTON */}
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="
    fixed bottom-6 right-6 w-16 h-16 rounded-full
    bg-gradient-to-r from-blue-600 to-cyan-500
    hover:from-blue-700 hover:to-cyan-600
    flex items-center justify-center text-white text-3xl
    shadow-[0_0_25px_rgba(0,115,255,0.6)]
    hover:shadow-[0_0_45px_rgba(0,115,255,0.8)]
    transition-all duration-500
    hover:-translate-y-1
    animate-bounce-slow
  ">
                        <i data-feather="plus" className="w-8 h-8"></i>
                    </button>

                    {submitError && (
                        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-900/90 border border-red-500/50 p-4 rounded-xl shadow-lg text-center animate-bounce-in">
                            <i data-feather="alert-triangle" className="w-5 h-5 inline text-red-400 mr-2"></i>
                            <span className="text-red-300">{submitError}</span>
                        </div>
                    )}

                    {showInput && <ScenarioInput onSave={handleCreate} theme="dark" />}
                    {showAnalytics && <Analytics scenarios={scenarios} getSymbol={getSymbol} theme="dark" />}
                    {showHistory && <History scenarios={scenarios} onDelete={handleDelete} getSymbol={getSymbol} theme="dark" />}
                </main>
            </div>

            <style jsx global>{`
        @keyframes gradient-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-flow {
          background-size: 300% 300%;
          animation: gradient-flow 15s ease infinite;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.7s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.7s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
      `}</style>
        </>
    );
};

export default Dashboard;
