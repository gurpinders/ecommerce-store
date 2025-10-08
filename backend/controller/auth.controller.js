import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, {
    EX: 7 * 24 * 60 * 60,
  });
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, //Prevents XSS Attacks (Cross-Site Scripting Attacks)
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //Prevents CSRF Attacks (Cross-Site Request Forgery)
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, //Prevents XSS Attacks (Cross-Site Scripting Attacks)
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //Prevents CSRF Attacks (Cross-Site Request Forgery)
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Sign Up Function:
export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // Check if User Exists -> If not create User
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    // Authentication:
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.log("Error in SignUp Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Login Function:
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in Login Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Logout Function:
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged Out Successfully" });
  } catch (error) {
    console.log("Error in Logout Controller", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// This Will Recreate a New Access Token:
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid Refresh Token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true, //Prevents XSS Attacks (Cross-Site Scripting Attacks)
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", //Prevents CSRF Attacks (Cross-Site Request Forgery)
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token Refreshed Successfully" });
  } catch (error) {
    console.log("Error in RefreshToken Controller", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// TODO: Implement Get Profile Later:
// export const getProfile = async (req, res) => {}

