const express = require("express");
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { UserModel, validateUser, validateLogin, createToken } = require("../models/userModel");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "users endpoint" });
});

// ראוטר לבדיקת טוקן
router.get("/checkToken", auth, async (req, res) => {
  res.json(req.tokenData);
});

// החזרת פרטי המשתמש (ללא סיסמה)
router.get("/userInfo", auth, async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// אזור שמחזיר רשימת משתמשים
router.get("/list", authAdmin, async (req, res) => {
  try {
    const skip = req.query.skip || 0;
    const data = await UserModel.find({}, { password: 0 }).limit(20).skip(skip);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// יצירת משתמש חדש
router.post("/", async (req, res) => {
  const validBody = validateUser(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const emailLower = req.body.email.toLowerCase(); // הפיכת המייל לאותיות קטנות
    const nameLower = req.body.name.toLowerCase(); // הפיכת השם לאותיות קטנות
    const user = new UserModel({ ...req.body, email: emailLower, name: nameLower });
    user.password = await bcrypt.hash(user.password, 10); // הצפנת סיסמה
    await user.save();
    user.password = "****";
    res.status(201).json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.status(400).json({ msg: "Email already in system", code: 11000 });
    }
    console.log(err);
    res.status(502).json({ err });
  }
});

// התחברות משתמש
router.post("/login", async (req, res) => {
  const validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const emailLower = req.body.email.toLowerCase(); // המרת המייל לאותיות קטנות
    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ err: "Email not in system" });
    }

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
      return res.status(401).json({ err: "Password not match" });
    }

    const token = createToken(user._id, user.role);
    res.cookie("token", token, {
      httpOnly: false,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    }).json({ token, msg: "You logged in", role: user.role });
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// יציאה מהמערכת
router.post("/logout", async (req, res) => {
  res.clearCookie("token").json({ msg: "You logged out" });
});

// עדכון תפקיד משתמש
router.patch("/role/:id/:role", authAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const role = req.params.role;
    if (id == req.tokenData._id) {
      return res.status(401).json({ err: "You can't edit yourself" });
    }
    const data = await UserModel.updateOne({ _id: id }, { role });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// מחיקת משתמש
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    let id = req.params.id;
    let data = await UserModel.deleteOne({ _id: id });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// בדיקת קיום מייל
router.get('/check-email/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase(); // המרה לאותיות קטנות
    const user = await UserModel.findOne({ email: email });

    if (user) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    return res.status(502).json({ err: 'Error checking email' });
  }
});

// איפוס סיסמה
router.post('/reset-password', async (req, res) => {
  try {
    const emailLower = req.body.email.toLowerCase(); // המרה לאותיות קטנות
    const { password } = req.body;

    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// שליפת שם המשתמש לפי טוקן
router.get("/userName", auth, async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.tokenData._id }, { name: 1, _id: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ userName: user.name });
  } catch (err) {
    console.error(err);
    res.status(502).json({ err: "Server error" });
  }
});



// Endpoint להחזרת פרטי המשתמש
router.get('/profilePage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // הנחה שה-ID נמצא ב-req.user.id
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { name, email, password } = user; // שולחים את הנתונים הנדרשים
    res.json({ name, email, password });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data', error });
  }
});

module.exports = router;


