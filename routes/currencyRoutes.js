const express = require("express");
const router = express.Router();
const {
    getSupportedCurrencies,
    getExchangeRates,
    convertCurrency,
} = require("../controllers/currencyController");
const { protect } = require("../middleware/authMiddleware");

// All currency routes require authentication
router.use(protect);

// Get supported currencies
router.get("/currencies", getSupportedCurrencies);

// Get current exchange rates
router.get("/rates", getExchangeRates);

// Convert currency amount
router.post("/convert", convertCurrency);

module.exports = router;
