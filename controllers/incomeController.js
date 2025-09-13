const xlsx = require("xlsx");
const Income = require("../models/Income");
const currencyService = require("../services/currencyService");

// Add Income Source
exports.addIncome = async (req, res) => {
    const userId = req.user.id;
    try {
        const {
            icon,
            source,
            amount,
            date,
            originalCurrency = "USD",
        } = req.body;

        // Validation: Check for missing fields
        if (!source || !amount || !date) {
            return res
                .status(400)
                .json({ message: "Please fill all the fields" });
        }

        const baseCurrency = "USD"; // Site's base currency
        let convertedAmount = parseFloat(amount);
        let exchangeRate = 1;

        // Convert currency if different from base currency
        if (originalCurrency !== baseCurrency) {
            try {
                const conversion = await currencyService.convertCurrency(
                    parseFloat(amount),
                    originalCurrency,
                    baseCurrency
                );
                convertedAmount = conversion.convertedAmount;
                exchangeRate = conversion.exchangeRate;
            } catch (error) {
                console.error("Currency conversion error:", error);
                return res.status(400).json({
                    message: "Currency conversion failed. Please try again.",
                });
            }
        }

        const newIncome = new Income({
            userId,
            icon,
            source,
            amount: convertedAmount, // Store in base currency
            originalAmount: parseFloat(amount), // Store original amount
            originalCurrency,
            baseCurrency,
            exchangeRate,
            date: new Date(date),
        });

        await newIncome.save();
        res.status(200).json(newIncome);
    } catch (error) {
        console.error("Add income error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// get All Income Source
exports.getAllIncome = async (req, res) => {
    const userId = req.user.id;
    try {
        const incomes = await Income.find({ userId }).sort({ date: -1 });
        res.status(200).json(incomes);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// delete Income Source
exports.deleteIncome = async (req, res) => {
    try {
        await Income.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Income deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// // dowmload Excel
// exports.downloadIncomeExcel = async (req, res) => {
//     const userId = req.user.id;
//     try {
//         const incomes = await Income.find({ userId }).sort({ date: -1 });

//         // prepare data for excel
//         const data = incomes.map((income) => ({
//             Source: income.source,
//             Amount: income.amount,
//             Date: income.date,
//         }));

//         const wb = xlsx.utils.book_new();
//         const ws = xlsx.utils.json_to_sheet(data);
//         xlsx.utils.book_append_sheet(wb, ws, "Income");

//         xlsx.writeFile(wb, "Income_details.xlsx");
//         res.download("Income_details.xlsx");
//     } catch (error) {
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// download Excel
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user.id;
    try {
        const incomes = await Income.find({ userId }).sort({ date: -1 });

        // prepare data for excel
        const data = incomes.map((income) => ({
            Source: income.source,
            Amount: income.amount,
            Date: income.date,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);

        xlsx.utils.book_append_sheet(wb, ws, "Income");

        // كتابة الملف في الذاكرة (buffer) بدل المشروع
        const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        // إعداد الهيدر للتحميل المباشر
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Income_details.xlsx"
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        // إرسال الملف مباشرة للمتصفح
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
