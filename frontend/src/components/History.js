// History.jsx
import React, { useState } from "react";
import { Archive, Tag, Calendar, Trash2, Inbox, Users, DollarSign, UserX } from "lucide-react";

const History = ({ scenarios = [], onDelete, getSymbol, theme }) => {
    const [hoveredScenario, setHoveredScenario] = useState(null);

    const safeScenarios = Array.isArray(scenarios) ? scenarios : [];

    // Debug log (remove in prod)
    console.log('History scenarios excluded:', safeScenarios.map(s => ({ id: s._id, excluded: s.excluded })));

    const handleMouseEnter = (scenario) => setHoveredScenario(scenario);
    const handleMouseLeave = () => setHoveredScenario(null);

    return (
        <div
            className={`mt-10 bg-gradient-to-br ${theme === "dark"
                ? "from-gray-900/90 via-gray-800/70 to-purple-950/70"
                : "from-white/90 via-gray-100/70 to-purple-100/50"
                } backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-fade-in border ${theme === "dark" ? "border-gray-700/30" : "border-gray-200/30"
                }`}
        >
            <h3
                className={`text-2xl sm:text-3xl font-bold mb-6 flex items-center space-x-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
            >
                <Archive className="w-6 h-6" />
                <span>Scenario History</span>
            </h3>

            {safeScenarios.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {safeScenarios.map((s) => {
                        // Fallback to ensure array
                        const excluded = Array.isArray(s.excluded) ? s.excluded : [];
                        return (
                            <div
                                key={s._id}
                                className={`p-4 rounded-xl transition-all duration-300 border flex flex-col sm:flex-row justify-between items-start gap-4 relative group ${theme === "dark"
                                    ? "bg-gray-700/50 border-gray-600/30 hover:bg-gray-600/50"
                                    : "bg-gray-100/50 border-gray-300/30 hover:bg-gray-200/50"
                                    }`}
                                onMouseEnter={() => handleMouseEnter(s)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="flex-1">
                                    <h4
                                        className={`font-bold text-base flex items-center space-x-2 mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"
                                            }`}
                                    >
                                        <Tag className="w-5 h-5 text-purple-400" />
                                        <span>{s.category || 'Uncategorized'}</span>
                                    </h4>

                                    <p
                                        className={`text-sm flex items-center space-x-2 mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                                            }`}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {new Date(s.date || Date.now()).toDateString()} ({s.currency || 'USD'})
                                        </span>
                                    </p>

                                    {/* Excluded Badge in Main View */}
                                    {excluded.length > 0 && (
                                        <div className="flex items-center space-x-2 mb-2">
                                            <UserX className="w-4 h-4 text-yellow-500" />
                                            <span
                                                className={`text-xs font-medium px-2 py-1 rounded-full bg-yellow-100/50 text-yellow-700 ${theme === "dark" ? "bg-yellow-900/30 text-yellow-300" : ""}`}
                                                title={`Excluded: ${excluded.join(', ')}`}
                                            >
                                                Excluded: {excluded.length}
                                            </span>
                                        </div>
                                    )}

                                    <p
                                        className={`text-sm truncate ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                                            }`}
                                        title={s.input || 'No description'}
                                    >
                                        {(s.input || '').substring(0, 100)}...
                                    </p>
                                </div>

                                <button
                                    onClick={() => onDelete(s._id)}
                                    className="bg-red-600/80 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 flex items-center space-x-2 text-white"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                </button>

                                {/* Enhanced Hover Tooltip with Exclusions */}
                                {hoveredScenario?._id === s._id && (
                                    <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800/95 border border-gray-600 rounded-lg p-4 shadow-lg z-10 text-sm">
                                        <h5 className={`font-bold mb-2 ${theme === "dark" ? "text-blue-300" : "text-blue-700"} flex items-center gap-2`}>
                                            <Users className="w-4 h-4" />
                                            Details
                                        </h5>
                                        <div className="mb-2">
                                            <p className="text-xs font-medium text-gray-300 mb-1">Excluded Participants:</p>
                                            {excluded.length > 0 ? (
                                                <p className="text-yellow-400 text-xs">
                                                    {excluded.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(', ')}
                                                </p>
                                            ) : (
                                                <p className="text-gray-500 text-xs italic">None excluded</p>
                                            )}
                                        </div>
                                        {(s.settlements || []).length > 0 ? (
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                <h6 className="text-xs font-semibold text-gray-300 mb-1">Settlements ({s.settlements.length})</h6>
                                                {(s.settlements || []).map((settle, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-gray-300">
                                                        <span>{settle.from} → {settle.to}</span>
                                                        <span className="font-semibold">{getSymbol(settle.currency || s.currency)}{settle.amount.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-xs italic">No settlements needed</p>
                                        )}
                                        <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400 flex justify-between">
                                            <span>Total Expenses: {getSymbol(s.currency)}{(s.expenses || []).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</span>
                                            <span>Balance Sum: ₹0.00</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Inbox
                        className={`w-12 h-12 mx-auto mb-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"
                            }`}
                    />
                    <p
                        className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"
                            } text-lg`}
                    >
                        No history yet. Start splitting!
                    </p>
                </div>
            )}

            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
        </div>
    );
};

export default History;