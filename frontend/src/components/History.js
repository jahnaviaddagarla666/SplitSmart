import React from "react";
import { Archive, Tag, Calendar, Trash2, Inbox } from "lucide-react";

const History = ({ scenarios, onDelete, getSymbol, theme }) => {
    return (
        <div
            className={`mt-10 bg-gradient-to-br ${theme === "dark"
                ? "from-gray-900/90 via-gray-800/70 to-purple-950/70"
                : "from-white/90 via-gray-100/70 to-purple-100/50"
                } backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-fade-in border ${theme === "dark" ? "border-gray-700/30" : "border-gray-200/30"
                }`}
        >
            {/* Header */}
            <h3
                className={`text-2xl sm:text-3xl font-bold mb-6 flex items-center space-x-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
            >
                <Archive className="w-6 h-6" />
                <span>Scenario History</span>
            </h3>

            {/* History List */}
            {scenarios.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {scenarios.map((s) => (
                        <div
                            key={s._id}
                            className={`p-4 rounded-xl transition-all duration-300 border flex flex-col sm:flex-row justify-between items-start gap-4 ${theme === "dark"
                                ? "bg-gray-700/50 border-gray-600/30 hover:bg-gray-600/50"
                                : "bg-gray-100/50 border-gray-300/30 hover:bg-gray-200/50"
                                } group`}
                        >
                            <div className="flex-1">
                                <h4
                                    className={`font-bold text-base flex items-center space-x-2 mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    <Tag className="w-5 h-5 text-purple-400" />
                                    <span>{s.category}</span>
                                </h4>

                                <p
                                    className={`text-sm flex items-center space-x-2 mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {new Date(s.date).toDateString()} ({s.currency})
                                    </span>
                                </p>

                                <p
                                    className={`text-sm truncate ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                                        }`}
                                    title={s.input}
                                >
                                    {s.input.substring(0, 100)}...
                                </p>
                            </div>

                            <button
                                onClick={() => onDelete(s._id)}
                                className="bg-red-600/80 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 flex items-center space-x-2 text-white"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        </div>
                    ))}
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

            {/* Fade-in animation */}
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
