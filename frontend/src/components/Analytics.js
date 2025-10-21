import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from "chart.js";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Analytics = ({ scenarios, getSymbol, theme = "dark", isLoading = false }) => {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const dateData = scenarios.reduce((acc, s) => {
        const dateKey = new Date(s.date).toLocaleDateString();
        if (!acc[dateKey]) acc[dateKey] = { total: 0, payers: new Set(), currency: s.currency };
        acc[dateKey].total += s.expenses.reduce((sum, e) => sum + e.amount, 0);
        s.expenses.forEach(e => acc[dateKey].payers.add(e.payer));
        return acc;
    }, {});

    const sortedDates = Object.keys(dateData).sort((a, b) => new Date(a) - new Date(b));
    const labels =
        selectedCategory === "all"
            ? sortedDates
            : sortedDates.filter(d =>
                scenarios.find(s => new Date(s.date).toLocaleDateString() === d)?.category === selectedCategory
            );
    const values = labels.map(d => dateData[d].total);
    const payersPerDate = labels.map(d => Array.from(dateData[d].payers).join(", "));
    const currencies = labels.map(d => dateData[d].currency);

    const getDynamicColors = count => {
        const baseColors = [
            "rgba(99, 102, 241, 0.8)",
            "rgba(168, 85, 247, 0.8)",
            "rgba(34, 197, 94, 0.8)",
            "rgba(234, 179, 8, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(239, 68, 68, 0.8)",
        ];
        return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
    };

    const data = {
        labels,
        datasets: [
            {
                label: "Total Expenses",
                data: values,
                backgroundColor: getDynamicColors(labels.length),
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
                hoverBackgroundColor: getDynamicColors(labels.length).map(c => c.replace("0.8", "0.95")),
                barPercentage: 0.8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: { color: theme === "dark" ? "#e5e7eb" : "#374151", font: { size: 12, weight: 500 } },
                grid: { display: false },
            },
            y: {
                ticks: {
                    color: theme === "dark" ? "#e5e7eb" : "#374151",
                    font: { size: 12, weight: 500 },
                    callback: value => `${value.toFixed(2)}`,
                },
                grid: { color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", lineWidth: 1 },
                beginAtZero: true,
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: theme === "dark" ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)",
                padding: 12,
                cornerRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                titleColor: theme === "dark" ? "#fff" : "#111",
                bodyColor: theme === "dark" ? "#e5e7eb" : "#111",
                borderColor: theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                borderWidth: 1,
                callbacks: {
                    title: context => `Date: ${context[0].label}`,
                    label: context => {
                        const idx = context.dataIndex;
                        const curr = currencies[idx];
                        const payers = payersPerDate[idx];
                        return [`Total: ${getSymbol(curr)}${context.parsed.y.toFixed(2)}`, `Paid by: ${payers}`];
                    },
                },
            },
        },
    };

    const downloadChart = () => {
        const canvas = document.querySelector("canvas");
        if (canvas) {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "expense-analytics.png";
            link.click();
        }
    };

    return (
        <motion.div
            className={`bg-gradient-to-br ${theme === "dark" ? "from-gray-900/90 via-gray-800/70 to-blue-950/70" : "from-white/90 via-gray-100/70 to-blue-100/50"
                } backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,255,0.4)] mb-10 border ${theme === "dark" ? "border-gray-700/30" : "border-gray-200/30"
                }`}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.5)", transition: { duration: 0.3 } }}
        >
            <motion.h3
                className={`text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-3 justify-center tracking-tight ${theme === "dark" ? "text-blue-300" : "text-blue-700"
                    }`}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <BarChart3 className={`w-6 h-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                <span>Expenses by Date (Hover for Payers)</span>
            </motion.h3>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <select
                    className={`p-2 rounded-lg w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
                        }`}
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                >
                    <option value="all">All Dates</option>
                    {[...new Set(scenarios.map(s => s.category))].map(cat => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>

                <motion.button
                    className={`px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${theme === "dark" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadChart}
                >
                    Download Chart
                </motion.button>
            </div>

            {isLoading ? (
                <motion.div
                    className={`h-80 sm:h-96 md:h-[28rem] ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
                        } rounded-lg animate-pulse`}
                />
            ) : labels.length > 0 ? (
                <motion.div
                    className="flex justify-center h-80 sm:h-96 md:h-[28rem] max-h-[80vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="w-full max-w-5xl">
                        <Bar data={data} options={options} />
                    </div>
                </motion.div>
            ) : (
                <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <BarChart3
                            className={`w-12 h-12 mx-auto mb-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                        />
                    </motion.div>
                    <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-lg mb-4`}>
                        No data yet. Add expenses!
                    </p>
                    <motion.button
                        className={`px-4 py-2 rounded-lg transition-colors ${theme === "dark" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Add Expenses Now
                    </motion.button>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Analytics;
