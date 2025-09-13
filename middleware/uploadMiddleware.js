const multer = require("multer");

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: (req, file, cd) => {
        cd(null, `${Date.now()}-${file.originalname}`);
    },
});

// File filter

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpeg, .jpg, .png format are allowed"), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
