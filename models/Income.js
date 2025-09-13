const mongoose = require("mongoose");

const IncomeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        icon: { type: String },
        source: { type: String, required: true }, // Example: Salary, Freelance, Investments, etc.
        amount: { type: Number, required: true },
        originalAmount: { type: Number }, // Amount in original currency
        originalCurrency: { type: String, default: "USD" }, // Original currency (USD, ILS)
        baseCurrency: { type: String, default: "USD" }, // Site's base currency
        exchangeRate: { type: Number }, // Exchange rate used for conversion
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Income", IncomeSchema);
