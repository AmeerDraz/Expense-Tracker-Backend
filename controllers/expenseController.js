const xlsx = require("xlsx");
const Expense = require("../models/Expense");
const currencyService = require("../services/currencyService");

// Add Expense
exports.addExpense = async (req, res) => {
    const userId = req.user.id;
    try {
        const {
            icon,
            category,
            amount,
            date,
            originalCurrency = "USD",
        } = req.body;

        // Validation: Check for missing fields
        if (!category || !amount || !date) {
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

        const newExpense = new Expense({
            userId,
            icon,
            category,
            amount: convertedAmount, // Store in base currency
            originalAmount: parseFloat(amount), // Store original amount
            originalCurrency,
            baseCurrency,
            exchangeRate,
            date: new Date(date),
        });

        await newExpense.save();
        res.status(200).json(newExpense);
    } catch (error) {
        console.error("Add expense error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// get All Expense Source
exports.getAllExpense = async (req, res) => {
    const userId = req.user.id;
    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });
        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// delete Income Source
exports.deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// dowmload Excel
// exports.downloadExpenseExcel = async (req, res) => {
//     const userId = req.user.id;
//     try {
//         const expense = await Expense.find({ userId }).sort({ date: -1 });

//         // prepare data for excel
//         const data = expense.map((expense) => ({
//             Category: expense.category,
//             Amount: expense.amount,
//             Date: expense.date,
//         }));

//         const wb = xlsx.utils.book_new();
//         const ws = xlsx.utils.json_to_sheet(data);
//         xlsx.utils.book_append_sheet(wb, ws, "Expense");
//         xlsx.writeFile(wb, "Expense_details.xlsx");
//         res.download("Expense_details.xlsx");
//     } catch (error) {
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// download Excel
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user.id;
    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });

        // prepare data for excel
        const data = expense.map((expense) => ({
            Category: expense.category,
            Amount: expense.amount,
            Date: expense.date,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Expense");

        // اكتب الملف في الذاكرة (buffer)
        const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        // رجع الملف مباشرة للمستخدم كاستجابة
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Expense_details.xlsx"
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
