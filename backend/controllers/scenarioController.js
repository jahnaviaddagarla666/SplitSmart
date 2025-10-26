// scenarioController.js (or wherever your controller is)
const Scenario = require('../models/Scenario');
const fetch = require('node-fetch');

// ------------------ PARSING FUNCTION ------------------
async function parseScenario(input, currency, participants = []) {
    if (!input.trim()) throw new Error('Input is empty');

    let participantHint = '';
    if (participants.length > 0) {
        participantHint = `Known participants: ${participants.join(', ')}. Use these or extract from input.`;
    }

    const basePrompt = `You are an AI that extracts structured expense data from natural language, even if abbreviated.
All amounts are in ${currency}. Do NOT include symbols.
Include ALL people mentioned as participants, INCLUDING the payer (e.g., if "j paid with ab", participants must be ["j", "ab"]).
Do NOT omit the payer—always add them to the participants array FIRST.
Use names as-is (e.g., 'j' is valid). Make participants unique.
EXCLUDED: STRICTLY extract ONLY if the input explicitly mentions excluding someone (e.g., "exclude john", "without bob", "opt out alice", "john not included"). If no such phrase, set to empty array []. Never assume exclusions. Payer cannot be excluded unless explicitly stated.

IMPORTANT: Output EXACTLY this JSON structure, no extra text:
{
  "participants": ["payer_name", "name2", ...],
  "expenses": [{"payer": "payer_name", "amount": 20, "description": "pizza"}, ...],
  "excluded": ["excluded_name1"]  // ALWAYS include this key, empty [] if none
}

Examples:
Input: "j paid 200 for food with ab"
Output: {
  "participants": ["j", "ab"],
  "expenses": [{"payer": "j", "amount": 200, "description": "food"}],
  "excluded": []
}

Input: "j paid 2000 for food with cha, ab"
Output: {
  "participants": ["j", "cha", "ab"],
  "expenses": [{"payer": "j", "amount": 2000, "description": "food"}],
  "excluded": []
}

Input: "j paid 2000 for food with cha, ab, exclude john"
Output: {
  "participants": ["j", "cha", "ab"],
  "expenses": [{"payer": "j", "amount": 2000, "description": "food"}],
  "excluded": ["john"]
}

Input: "j paid 900 for shopping with Sohithi, exclude John"
Output: {
  "participants": ["j", "Sohithi"],
  "expenses": [{"payer": "j", "amount": 900, "description": "shopping"}],
  "excluded": ["John"]
}

Input: "j paid 1500 for travel with team, without bob"
Output: {
  "participants": ["j", "team"],
  "expenses": [{"payer": "j", "amount": 1500, "description": "travel"}],
  "excluded": ["bob"]
}

Now process this input exactly: "${input}" ${participantHint ? `\n${participantHint}` : ''}`;

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
                    messages: [{ role: "user", content: formattedPrompt }],
                    max_tokens: 300,
                    temperature: 0.0,  // Zero for strict adherence
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

            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error('Invalid OpenRouter response format');
            }

            let text = data.choices[0].message.content.trim();
            text = text
                .replace(/^<s>\[INST\].*?\[\/INST\]\s*/i, '')
                .replace(/```(?:json)?\n?/g, '')
                .replace(/```/g, '')
                .trim();

            // If not valid JSON, retry or fallback
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (jsonErr) {
                console.warn('JSON parse failed, raw text:', text);
                throw new Error('AI output not valid JSON—retrying...');
            }

            if (!parsed.participants?.length) throw new Error('No participants extracted');
            if (!parsed.expenses?.length) throw new Error('No expenses extracted');
            if (!Array.isArray(parsed.excluded)) parsed.excluded = [];  // Fallback

            // Ensure every payer is included (and not excluded unless specified)
            parsed.expenses.forEach(exp => {
                if (exp.payer && !parsed.participants.includes(exp.payer)) {
                    parsed.participants.unshift(exp.payer);
                }
            });

            // Remove excluded from participants if present (but keep payer if not excluded)
            if (parsed.excluded && parsed.excluded.length > 0) {
                parsed.participants = parsed.participants.filter(p => !parsed.excluded.includes(p));
                // Re-add payer if it was removed
                if (parsed.expenses[0]?.payer && !parsed.participants.includes(parsed.expenses[0].payer)) {
                    parsed.participants.unshift(parsed.expenses[0].payer);
                }
            }

            parsed.participants = [...new Set(parsed.participants.map(p => p.trim().toLowerCase()))];  // Normalize for matching
            parsed.excluded = parsed.excluded.map(e => e.trim().toLowerCase());  // Normalize excluded too

            parsed.expenses = parsed.expenses.map(e => ({ ...e, amount: Number(e.amount) || 0 }));

            console.log('🔍 Parsed excluded (normalized):', parsed.excluded);  // Extra log

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

// ------------------ BALANCE COMPUTATION ------------------
function computeBalancesAndSettlements(participants, expenses, excluded = []) {
    const balances = {};
    participants.forEach(p => balances[p] = 0);

    for (const exp of expenses) {
        const payer = exp.payer;

        // Sharers: participants except excluded ones AND the payer
        const sharers = participants.filter(p => p !== payer && !excluded.includes(p));

        // ✅ If all are excluded (no valid sharers), skip the expense
        if (sharers.length === 0) continue;

        // Split equally among sharers only
        const share = exp.amount / sharers.length;

        // Subtract share from sharers
        sharers.forEach(s => {
            balances[s] -= share;
        });

        // Add total amount to payer (payer gets back what others owe)
        balances[payer] += exp.amount;
    }

    const balanceArray = Object.entries(balances).map(([name, balance]) => ({
        name,
        balance,
    }));

    // Compute settlements
    function computeSettlements(bals) {
        let positives = bals.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
        let negatives = bals.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
        const settlements = [];

        while (positives.length && negatives.length) {
            const cred = positives[0];
            const deb = negatives[0];
            const amt = Math.min(cred.balance, -deb.balance);
            settlements.push({ from: deb.name, to: cred.name, amount: Math.abs(amt) });
            cred.balance -= amt;
            deb.balance += amt;
            if (Math.abs(cred.balance) < 0.01) positives.shift();
            if (Math.abs(deb.balance) < 0.01) negatives.shift();
        }

        return settlements;
    }

    const settlements = computeSettlements([...balanceArray]);
    return { balances: balanceArray, settlements };
}


// ------------------ CREATE SCENARIO ------------------
exports.create = async (req, res) => {
    try {
        const { scenarios, participants: globalParticipants, category, currency = 'USD' } = req.body;
        const userId = req.userId;

        if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
            return res.status(400).json({ error: 'Scenarios array required' });
        }
        if (!category) {
            return res.status(400).json({ error: 'Category required' });
        }

        const createdScenarios = [];
        const failedScenarios = [];

        for (let i = 0; i < scenarios.length; i++) {
            const { input, date, excluded: bodyExcluded = [] } = scenarios[i];
            if (!input || !date) {
                failedScenarios.push({ index: i + 1, reason: 'Missing input or date' });
                continue;
            }

            try {
                console.log(`📝 Parsing input ${i + 1}:`, input);
                const parsed = await parseScenario(input, currency, globalParticipants || []);
                console.log(`✅ Parsed data ${i + 1}:`, parsed);

                let { participants, expenses, excluded: parsedExcluded = [] } = parsed;
                const payer = expenses[0]?.payer;

                // Use parsed excluded, fallback to body if empty
                const finalExcluded = (parsedExcluded.length > 0 ? parsedExcluded : bodyExcluded)
                    .map(e => e.trim().toLowerCase())  // Ensure normalized
                    .filter(Boolean);  // Remove empties

                console.log(`🔍 Final excluded for scenario ${i + 1} (normalized):`, finalExcluded);  // Enhanced log

                // Always include payer in effective participants (unless explicitly excluded)
                const effectiveParticipants = [...new Set([
                    payer?.toLowerCase(),
                    ...participants.filter(p => !finalExcluded.includes(p.toLowerCase()))
                ].filter(Boolean))].map(p => p.trim());  // Re-trim

                // Check for valid sharers (non-excluded participants)
                const potentialSharers = effectiveParticipants.filter(p => !finalExcluded.includes(p));
                if (potentialSharers.length === 0) {
                    throw new Error('No one to share the expense with after exclusions');
                }

                // Validate and parse date
                let parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                    const [year, month, day] = date.split('-');
                    parsedDate = new Date(`${year}-${month}-${day}`);
                }
                if (isNaN(parsedDate.getTime())) {
                    throw new Error('Invalid date—use YYYY-MM-DD');
                }

                // Compute balances and settlements
                const { balances, settlements } = computeBalancesAndSettlements(
                    effectiveParticipants,
                    expenses,
                    finalExcluded
                );

                const scenario = new Scenario({
                    userId,
                    category,
                    currency,
                    input,
                    participants: effectiveParticipants,
                    expenses,
                    balances,
                    settlements,
                    date: parsedDate,
                    excluded: finalExcluded,
                });

                await scenario.save();
                console.log(`💾 Scenario ${i + 1} saved:`, scenario._id);
                createdScenarios.push(scenario);
            } catch (scenarioError) {
                console.error(`❌ Scenario ${i + 1} failed:`, scenarioError.message);
                let userError = scenarioError.message;
                if (userError.includes('AI parsing') || userError.includes('OpenRouter API')) {
                    userError = 'AI parsing failed—use clearer input with full names.';
                }
                failedScenarios.push({
                    index: i + 1,
                    input: input.substring(0, 50) + '...',
                    reason: userError
                });
            }
        }

        if (createdScenarios.length === 0) {
            return res.status(400).json({ error: 'No valid scenarios created', failures: failedScenarios });
        }

        const responseData = { scenarios: createdScenarios };
        if (failedScenarios.length > 0 && process.env.NODE_ENV !== 'production') {
            responseData.failures = failedScenarios;
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('❌ Create scenario error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ------------------ GET ALL SCENARIOS ------------------
exports.getAll = async (req, res) => {
    try {
        const userId = req.userId;
        const scenarios = await Scenario.find({ userId }).sort({ date: -1 }).populate('userId', 'name');
        res.json(scenarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ------------------ DELETE SCENARIO ------------------
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