const currencyService = require("../services/currencyService");

// Get supported currencies
exports.getSupportedCurrencies = async (req, res) => {
    try {
        const currencies = currencyService.getSupportedCurrencies();
        res.status(200).json(currencies);
    } catch (error) {
        console.error("Get currencies error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get current exchange rates
exports.getExchangeRates = async (req, res) => {
    try {
        const { from = "USD", to = "ILS" } = req.query;

        const exchangeRate = await currencyService.getExchangeRate(from, to);

        res.status(200).json({
            from,
            to,
            rate: exchangeRate,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Get exchange rate error:", error);
        res.status(500).json({
            message: "Failed to get exchange rate",
            error: error.message,
        });
    }
};

// Convert currency amount
exports.convertCurrency = async (req, res) => {
    try {
        const { amount, from, to } = req.body;

        if (!amount || !from || !to) {
            return res.status(400).json({
                message: "Amount, from currency, and to currency are required",
            });
        }

        const result = await currencyService.convertCurrency(
            parseFloat(amount),
            from,
            to
        );

        res.status(200).json({
            originalAmount: parseFloat(amount),
            convertedAmount: result.convertedAmount,
            from,
            to,
            exchangeRate: result.exchangeRate,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Convert currency error:", error);
        res.status(500).json({
            message: "Currency conversion failed",
            error: error.message,
        });
    }
};
