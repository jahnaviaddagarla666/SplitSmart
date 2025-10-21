const Scenario = require('../models/Scenario');
const fetch = require('node-fetch');

async function parseScenario(input, currency, participants = []) {
    if (!input.trim()) throw new Error('Input is empty');

    let participantHint = '';
    if (participants.length > 0) {
        participantHint = `Known participants: ${participants.join(', ')}. Use these or extract from input.`;
    }

    const basePrompt = `You are an AI that extracts structured expense data from natural language, even if abbreviated.
All amounts are in ${currency}. Do NOT include symbols.
Include all people mentioned as participants (use as-is, e.g., 'j' is valid).
Be concise, output ONLY valid JSON:

{
  "participants": ["name1", "name2", ...],
  "expenses": [{"payer": "name1", "amount": 20, "description": "pizza"}, ...]
}

Example:
Input: "j paid 200 for food with ab"
Output:
{
  "participants": ["j", "ab"],
  "expenses": [{"payer": "j", "amount": 200, "description": "food"}]
}

Now process: "${input}"`;

    const formattedPrompt = `<s>[INST] ${basePrompt} [/INST]`;

    const url = "https://openrouter.ai/api/v1/chat/completions";

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "mistralai/mistral-7b-instruct-v0.2",
                    messages: [
                        {
                            role: "user",
                            content: formattedPrompt
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.2,
                    top_p: 0.9,
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { error: response.statusText };
                }
                throw new Error(`OpenRouter API error (${response.status}): ${errorData.error || 'Unknown'}`);
            }

            const data = await response.json();

            if (process.env.NODE_ENV !== 'production') {
                console.log(`🧠 OpenRouter Attempt ${attempt} Response:`, data);
            }

            if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
                throw new Error('Invalid OpenRouter response format');
            }

            let text = data.choices[0].message.content.trim();
            text = text
                .replace(/^<s>\[INST\].*?\[\/INST\]\s*/i, '')
                .replace(/```(?:json)?\n?/g, '')
                .replace(/```/g, '')
                .trim();

            if (!text) {
                throw new Error('Empty generation from OpenRouter');
            }

            const parsed = JSON.parse(text);

            if (!parsed.participants || !Array.isArray(parsed.participants) || parsed.participants.length === 0) {
                throw new Error('No participants extracted—try full names');
            }
            if (!parsed.expenses || !Array.isArray(parsed.expenses) || parsed.expenses.length === 0) {
                throw new Error('No expenses extracted');
            }

            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ Parsed JSON:', parsed);
            }
            return parsed;

        } catch (error) {
            console.error(`❌ OpenRouter Attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw new Error(`AI parsing failed after ${maxRetries} tries—check input clarity or API key. Details: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }
}

function computeBalancesAndSettlements(participants, expenses) {
    const numPeople = participants.length;
    if (numPeople === 0) throw new Error('No participants found');
    const balances = participants.map(p => ({ name: p, balance: 0 }));

    for (const exp of expenses) {
        const share = exp.amount / numPeople;
        for (const p of participants) {
            if (p === exp.payer) {
                balances.find(b => b.name === p).balance += (exp.amount - share);
            } else {
                balances.find(b => b.name === p).balance -= share;
            }
        }
    }

    function computeSettlements(bals) {
        let positives = bals.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
        let negatives = bals.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
        const settlements = [];
        while (positives.length && negatives.length) {
            const cred = positives[0];
            const deb = negatives[0];
            const amt = Math.min(cred.balance, -deb.balance);
            settlements.push({ from: deb.name, to: cred.name, amount: amt });
            cred.balance -= amt;
            deb.balance += amt;
            if (Math.abs(cred.balance) < 0.01) positives.shift();
            if (Math.abs(deb.balance) < 0.01) negatives.shift();
        }
        return settlements;
    }

    const settlements = computeSettlements(balances.map(b => ({ ...b })));
    return { balances, settlements };
}

exports.create = async (req, res) => {
    try {
        const { scenarios, participants: globalParticipants, category, currency = 'USD' } = req.body;
        const userId = req.userId;

        console.log('Received payload:', req.body); // Debug

        if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
            console.log('Validation failed - scenarios:', scenarios);
            return res.status(400).json({ error: 'Scenarios array required - check console for payload' });
        }
        if (!category) {
            return res.status(400).json({ error: 'Category required' });
        }

        const createdScenarios = [];
        for (const { input, date } of scenarios) {
            if (!input || !date) continue;

            console.log('📝 Parsing input:', input);
            const parsed = await parseScenario(input, currency, globalParticipants || []);
            console.log('✅ Parsed data:', parsed);

            const { participants, expenses } = parsed;
            if (!participants || participants.length === 0) {
                return res.status(400).json({ error: 'No participants detected—try mentioning names clearly' });
            }

            let parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                const [day, month, year] = date.split('-');
                parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            }
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format—use YYYY-MM-DD or DD-MM-YYYY' });
            }

            const { balances, settlements } = computeBalancesAndSettlements(participants, expenses);

            const scenario = new Scenario({
                userId,
                category,
                currency,
                input,
                participants,
                expenses,
                balances,
                settlements,
                date: parsedDate,
            });

            await scenario.save();
            console.log('💾 Scenario saved:', scenario._id);
            createdScenarios.push(scenario);
        }

        if (createdScenarios.length === 0) {
            return res.status(400).json({ error: 'No valid scenarios created' });
        }

        res.status(201).json(createdScenarios);
    } catch (error) {
        console.error('❌ Create scenario error:', error);
        let userError = error.message;
        if (userError.includes('AI parsing') || userError.includes('OpenRouter API')) {
            userError = 'AI parsing failed—use clearer input with full names.';
        } else if (userError.includes('OPENROUTER_API_KEY')) {
            userError = 'Missing OpenRouter API key—set OPENROUTER_API_KEY in .env.';
        }
        res.status(500).json({ error: userError });
    }
};

exports.getAll = async (req, res) => {
    try {
        const userId = req.userId;
        const scenarios = await Scenario.find({ userId }).sort({ date: -1 }).populate('userId', 'name');
        res.json(scenarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        await Scenario.findOneAndDelete({ _id: id, userId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};