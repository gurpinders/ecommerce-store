import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
  getAnalyticsData,
  getDailySalesData,
} from "../controller/analytics.controller.js";

const router = express.Router();

router.post("/", protectRoute, adminRoute, async (req, res) => {
  try {
    const analyticsData = await getAnalyticsData();

    // Making Analytic Graph For 7 - Day Period
    const endDate = new Date();
    const startDate = new Date(endDate.getTime - 7 * 24 * 60 * 60 * 1000);

    const dailySalesData = await getDailySalesData(startDate, endDate);
    res.json({
      analyticsData,
      dailySalesData,
    });
  } catch (error) {
    console.log("Error in analytics route", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
export default router;
