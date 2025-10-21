const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    currency: { type: String, required: true, default: 'USD' },
    input: { type: String, required: true },
    participants: [{ type: String }],
    expenses: [{
        payer: { type: String, required: true },
        amount: { type: Number, required: true },
        description: { type: String, required: true }
    }],
    balances: [{ name: String, balance: Number }],
    settlements: [{ from: String, to: String, amount: Number }]
}, { timestamps: true });

module.exports = mongoose.model('Scenario', scenarioSchema);