const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { registerSchema, loginSchema } = require("../validators/auth");

const SALT_ROUNDS = 12;

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const setCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === "production" ? "none" : "lax"),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

exports.register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    }
    const { fullName, username, email, password } = parsed.data;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? "email" : "username";
      return res.status(409).json({ success: false, message: `This ${field} is already registered` });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ fullName, username: username.toLowerCase(), email: email.toLowerCase(), passwordHash });
    const token = generateToken(user._id);
    res.cookie("token", token, setCookieOptions());
    res.status(201).json({ success: true, message: "Registration successful", user, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    }
    const { identifier, password } = parsed.data;
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res.cookie("token", token, setCookieOptions());
    const userObj = user.toJSON();
    res.json({ success: true, message: "Login successful", user: userObj, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true, message: "Logged out successfully" });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
