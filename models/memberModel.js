const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
require("dotenv").config();

console.log(process.env.TOKEN_SECRET);

// יצירת סכמה למשתמש
const memberSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  // כאן אנחנו מגדירים את תפקיד המשתמש, ברירת המחדל היא "user"
  role: {
    type: String,
    default: "user",
    enum: ["user"], // אפשרות אחת בלבד - "user"
  },
}, { timestamps: true });

exports.UserModel = mongoose.model("users", memberSchema);

// יצירת טוקן
exports.createToken = (user_id, role) => {
  if (role !== "user") {
    throw new Error("Only regular users can get a token.");
  }

  const token = jwt.sign({ _id: user_id, role }, process.env.TOKEN_SECRET, { expiresIn: "600mins" });
  return token;
};

// ולידציה למשתמש חדש
exports.validateUser = (_reqBody) => {
  const joiSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().min(2).max(100).email().required(),
    password: Joi.string().min(3).max(20).required(),
  });
  return joiSchema.validate(_reqBody);
};

// ולידציה להתחברות (לוגין) - לוודא שזו משתמש רגיל
exports.validateLogin = (_reqBody) => {
  const joiSchema = Joi.object({
    email: Joi.string().min(2).max(100).email().required(),
    password: Joi.string().min(3).max(20).required(),
  });
  return joiSchema.validate(_reqBody);
};

// פונקציה לבדוק אם האימייל קיים במערכת
exports.checkEmailExists = async (email) => {
  const user = await exports.UserModel.findOne({ email });
  return user ? true : false;
};
