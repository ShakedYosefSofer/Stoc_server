const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware לאימות משתמש רגיל או אדמין
exports.auth = (req, res, next) => {
  const token = req.cookies["token"] || req.header("Authorization"); // תומך גם ב-Header וגם ב-Cookie
  if (!token) {
    return res.status(401).json({ err: "You need to send token" });
  }
  
  // אם ה-Token הגיע דרך Header, נפטר מ-"Bearer "
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  try {
    const decodeToken = jwt.verify(token, process.env.TOKEN_SECRET);
    req.tokenData = decodeToken;
    next();
  } catch (err) {
    return res.status(401).json({ err: "Token invalid or expired" });
  }
};

// Middleware לאימות אדמין בלבד
exports.authAdmin = (req, res, next) => {
  const token = req.cookies["token"] || req.header("Authorization");
  if (!token) {
    return res.status(401).json({ err: "You need to send token" });
  }

  // תמיכה גם בטוקן שנשלח ב-Header
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  try {
    const decodeToken = jwt.verify(token, process.env.TOKEN_SECRET);
    if (!["admin", "superadmin"].includes(decodeToken.role)) {
      return res.status(403).json({ err: "Access denied. Admins only." });
    }

    req.tokenData = decodeToken;
    next();
  } catch (err) {
    return res.status(401).json({ err: "Token invalid or expired" });
  }
};


// Middleware לאימות בעלות על משרה (User-specific)

exports.authJobOwner = (req, res, next) => {
  const token = req.cookies["token"];
  if (!token) {
    return res.status(401).json({ err: "You need to send token" });
  }
  try {
    const decodeToken = jwt.verify(token, process.env.TOKEN_SECRET);
    req.tokenData = decodeToken;

    // Validate job ownership
    const jobOwnerId = req.body.userId || req.params.userId;
    if (decodeToken.role !== "admin" && decodeToken.id !== jobOwnerId) {
      return res.status(403).json({ err: "Access denied. Not your job." });
    }
    next();
  } catch (err) {
    return res.status(401).json({ err: "Token invalid or expired" });
  }
};





// // Middleware לאימות אדמין או משתמש רגיל

// exports.authAdminOrUser = (req, res, next) => {
//   const token = req.cookies["token"];
//   if (!token) {
//     return res.status(401).json({ err: "You need to send token" });
//   }
//   try {
//     const decodeToken = jwt.verify(token, process.env.TOKEN_SECRET);
//     req.tokenData = decodeToken;

//     if (decodeToken.role !== "admin") {
//       return res.status(403).json({ err: "Access denied. Admins only." });
//     }

//     next();
//   } catch (err) {
//     return res.status(401).json({ err: "Token invalid or expired" });
//   }
// };
