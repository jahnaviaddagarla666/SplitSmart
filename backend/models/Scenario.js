// models/Scenario.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    payer: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true }
});

const balanceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    balance: { type: Number, required: true }
});

const settlementSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true }
});

const scenarioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    currency: { type: String, default: 'USD' },
    input: { type: String, required: true },
    participants: [{ type: String }],
    expenses: [expenseSchema],
    balances: [balanceSchema],
    settlements: [settlementSchema],
    date: { type: Date, required: true },
    excluded: [{ type: String }]  // ✅ Add this line—array of strings for excluded names
}, {
    timestamps: true  // Optional: adds createdAt/updatedAt
});

module.exports = mongoose.model('Scenario', scenarioSchema);