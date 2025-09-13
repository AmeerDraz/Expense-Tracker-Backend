const axios = require("axios");
require("dotenv").config();

class CurrencyService {
    constructor() {
        this.apiKey = process.env.CURRENCY_API_KEY;
        this.baseUrl = "https://api.currencyfreaks.com/latest";
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Get exchange rate between two currencies
     * @param {string} fromCurrency - Source currency (e.g., 'USD', 'ILS')
     * @param {string} toCurrency - Target currency (e.g., 'USD', 'ILS')
     * @returns {Promise<number>} Exchange rate
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        // If same currency, return 1
        if (fromCurrency === toCurrency) {
            return 1;
        }

        const cacheKey = `${fromCurrency}_${toCurrency}`;
        const cached = this.cache.get(cacheKey);

        // Check if we have valid cached data
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.rate;
        }

        try {
            // Use CurrencyFreak API (free tier: 1,000 requests/month)
            const response = await axios.get(this.baseUrl, {
                params: {
                    apikey: this.apiKey,
                    symbols: toCurrency,
                    base: fromCurrency,
                },
            });

            if (
                response.data &&
                response.data.rates &&
                response.data.rates[toCurrency]
            ) {
                const rate = parseFloat(response.data.rates[toCurrency]);

                // Cache the result
                this.cache.set(cacheKey, {
                    rate: rate,
                    timestamp: Date.now(),
                });

                return rate;
            } else {
                throw new Error(
                    `Exchange rate not found for ${fromCurrency} to ${toCurrency}`
                );
            }
        } catch (error) {
            console.error("Currency API Error:", error.message);

            // Fallback rates (approximate values, should be updated regularly)
            const fallbackRates = {
                USD_ILS: 3.7,
                ILS_USD: 0.27,
            };

            const fallbackKey = `${fromCurrency}_${toCurrency}`;
            if (fallbackRates[fallbackKey]) {
                console.log(
                    `Using fallback rate for ${fallbackKey}: ${fallbackRates[fallbackKey]}`
                );
                return fallbackRates[fallbackKey];
            }

            throw new Error(
                `Unable to get exchange rate for ${fromCurrency} to ${toCurrency}`
            );
        }
    }

    /**
     * Convert amount from one currency to another
     * @param {number} amount - Amount to convert
     * @param {string} fromCurrency - Source currency
     * @param {string} toCurrency - Target currency
     * @returns {Promise<{convertedAmount: number, exchangeRate: number}>}
     */
    async convertCurrency(amount, fromCurrency, toCurrency) {
        const exchangeRate = await this.getExchangeRate(
            fromCurrency,
            toCurrency
        );
        const convertedAmount = amount * exchangeRate;

        return {
            convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
            exchangeRate: exchangeRate,
        };
    }

    /**
     * Get supported currencies
     * @returns {Array} List of supported currency codes
     */
    getSupportedCurrencies() {
        return [
            { code: "USD", name: "US Dollar", symbol: "$" },
            { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
        ];
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache() {
        this.cache.clear();
    }
}

module.exports = new CurrencyService();
