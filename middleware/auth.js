const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    //ambil tooken dari header
    const authHeader = req.header("Authorization");

    //cek klo gk ada header authorization
    if (!authHeader) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    //cek klo formatnya bukan "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res
        .status(401)
        .json({ message: "Token format is incorrect, authorization denied" });
    }

    try {
        //verifikasi token
        const decoded = jwt.verify(token, "your_super_secret_jwt_key");
        
        //tambahin user dari playload token ke object request
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: "Token is not valid" });
    }
};