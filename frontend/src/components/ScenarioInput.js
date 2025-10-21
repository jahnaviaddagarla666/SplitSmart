import React, { useState, useRef, useMemo } from 'react';
import {
    Edit,
    Tag,
    Users,
    MessageSquare,
    XCircle,
    Calendar,
    DollarSign,
    Zap,
    Loader,
    Plus,
    Trash2
} from 'react-feather';

const CURRENCY_OPTIONS = [
    { value: 'INR', symbol: '₹' },
    { value: 'USD', symbol: '$' },
    { value: 'EUR', symbol: '€' },
    { value: 'GBP', symbol: '£' },
    { value: 'JPY', symbol: '¥' },
    { value: 'AUD', symbol: 'A$' },
    { value: 'CAD', symbol: 'C$' }
];

const ScenarioInput = ({ onSave, theme = 'dark' }) => {
    const [scenarios, setScenarios] = useState([{ id: Date.now(), input: '', date: new Date().toISOString().split('T')[0], excluded: [] }]);
    const [globalParticipants, setGlobalParticipants] = useState('');
    const [category, setCategory] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef({});

    const parsedGlobalParticipants = useMemo(() =>
        globalParticipants.split(',').map(p => p.trim()).filter(Boolean),
        [globalParticipants]
    );

    const addScenario = () => setScenarios(prev => [...prev, { id: Date.now(), input: '', date: new Date().toISOString().split('T')[0], excluded: [] }]);
    const removeScenario = (id) => setScenarios(prev => prev.filter(s => s.id !== id));
    const updateScenario = (id, field, value) => setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    const toggleExclude = (scenarioId, participant) => {
        setScenarios(prev => prev.map(s => {
            if (s.id !== scenarioId) return s;
            const currentExcluded = Array.isArray(s.excluded) ? s.excluded : [];
            const isExcluded = currentExcluded.includes(participant);
            const newExcluded = isExcluded
                ? currentExcluded.filter(p => p !== participant)
                : [...currentExcluded, participant];
            return { ...s, excluded: newExcluded };
        }));
    };
    const handleInputChange = (id, e) => updateScenario(id, 'input', e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validScenarios = scenarios.filter(s => s.input.trim() && s.date);

        if (!category.trim()) return setError('Category required');
        if (parsedGlobalParticipants.length === 0) return setError('Add at least one participant');
        if (validScenarios.length === 0) return setError('Add at least one scenario');

        setLoading(true);
        setError('');
        try {
            const payload = {
                scenarios: validScenarios.map(s => ({ input: s.input.trim(), date: s.date, excluded: s.excluded })),
                participants: parsedGlobalParticipants,
                category: category.trim(),
                currency
            };
            await onSave(payload);
            setScenarios([{ id: Date.now(), input: '', date: new Date().toISOString().split('T')[0], excluded: [] }]);
            setGlobalParticipants('');
            setCategory('');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    };

    const isValidScenario = (s) => s.input.trim() && s.date;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-black/80 to-blue-950/70 backdrop-blur-lg p-8 rounded-3xl shadow-[0_0_25px_rgba(0,0,255,0.5)] border border-blue-900/40 animate-slide-down space-y-6">
                <h3 className="text-3xl font-extrabold text-blue-400 flex items-center space-x-2">
                    <Edit className="w-6 h-6" /> Add Expense Scenario's
                </h3>

                {error && <p className="text-red-400 p-2 rounded bg-red-900/20 border border-red-700/40">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                            <Tag className="w-4 h-4" /> Category
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Food, Travel, etc."
                            className="w-full p-4 rounded-xl bg-black/60 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                            <Users className="w-4 h-4" /> Participants
                        </label>
                        <input
                            type="text"
                            value={globalParticipants}
                            onChange={(e) => setGlobalParticipants(e.target.value)}
                            placeholder="j, ab, cha"
                            className="w-full p-4 rounded-xl bg-black/60 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40"
                            required
                        />
                        <p className="text-xs mt-1 text-gray-400">Payers auto-detected. Exclusions per scenario.</p>
                    </div>

                    {scenarios.map((scenario, idx) => (
                        <div key={scenario.id} className="border border-gray-700/50 rounded-xl p-4 space-y-3 bg-black/30">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-gray-300">Scenario {idx + 1}</h4>
                                <button type="button" onClick={() => removeScenario(scenario.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                                    <MessageSquare className="w-4 h-4" /> Description
                                </label>
                                <textarea
                                    ref={el => inputRefs.current[scenario.id] = el}
                                    value={scenario.input}
                                    onChange={(e) => handleInputChange(scenario.id, e)}
                                    placeholder="j paid 200 for food with ab"
                                    className="w-full p-3 rounded-lg bg-black/60 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 h-24 resize-none text-sm"
                                    required
                                />
                                <p className={`text-xs mt-1 ${isValidScenario(scenario) ? 'text-green-500' : 'text-red-500'}`}>
                                    {isValidScenario(scenario) ? 'Valid! Ready to save.' : 'Type your scenario above.'}
                                </p>
                            </div>

                            {parsedGlobalParticipants.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                                        <XCircle className="w-4 h-4" /> Exclude Participants
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-300">
                                        {parsedGlobalParticipants.map(p => (
                                            <label key={p} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={scenario.excluded?.includes(p) || false}
                                                    onChange={() => toggleExclude(scenario.id, p)}
                                                    className="rounded text-blue-400"
                                                />
                                                <span className="text-xs">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {scenario.excluded.length > 0 && (
                                        <p className="text-xs mt-1 text-yellow-500">
                                            Excluded: {scenario.excluded.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1 flex items-center space-x-2">
                                    <Calendar className="w-3 h-3" /> Date
                                </label>
                                <input
                                    type="date"
                                    value={scenario.date}
                                    onChange={(e) => updateScenario(scenario.id, 'date', e.target.value)}
                                    className="w-full p-3 rounded-lg bg-black/60 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 text-sm"
                                    required
                                />
                            </div>
                        </div>
                    ))}

                    <button type="button" onClick={addScenario} className="w-full py-3 border-2 border-dashed rounded-xl text-gray-400 hover:border-blue-500 hover:text-blue-400 flex items-center justify-center space-x-2">
                        <Plus className="w-4 h-4" /> <span>Add Another Scenario</span>
                    </button>

                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                                <DollarSign className="w-4 h-4" /> Currency
                            </label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-4 rounded-xl bg-black/60 border border-gray-700 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 text-sm">
                                {CURRENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.symbol}</option>)}
                            </select>
                        </div>

                        <button type="submit" disabled={loading || !category.trim() || scenarios.filter(isValidScenario).length === 0} className="w-full sm:w-auto bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 py-4 px-8 rounded-xl text-white font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_40px_rgba(0,115,255,0.9)] transition-all duration-500">
                            {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                            {loading ? 'Parsing...' : 'Save Scenarios'}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-down { animation: slide-down 0.5s ease-in-out; }
            `}</style>
        </div>
    );
};

export default ScenarioInput;
