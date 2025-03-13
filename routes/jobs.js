const express = require("express");
const { JobModel, validateJob } = require("../models/jobModel");
const { auth, authAdmin } = require("../middlewares/auth");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");
const Job = require('../models/jobModel'); // המודל של המשרות


router.get("/", async (req, res) => {
  const limit = Math.min(req.query.limit, 20) || 12;
  const skip = req.query.skip || 0;
  const sort = req.query.sort || "_id";
  const reverse = req.query.reverse == "yes" ? 1 : -1;

  try {
    let findFilter = {};
    if (req.query.category) {
      findFilter.category = req.query.category;
    }
    if (req.query.s) {
      let queryExp = new RegExp(req.query.s, "i");
      findFilter.$or = [{ title: queryExp }, { description: queryExp }];
    }

    const jobs = await JobModel.find(findFilter)
      .limit(limit)
      .skip(skip)
      .sort({ [sort]: reverse });

    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(502).json({ err });
  }
});

router.get("/single/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let job = await JobModel.findOne({ _id: id });
    res.json(job);
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(502).json({ err });
  }
});

// שליפת מספר רשומות לפי ה-ID שלהם
router.post("/group", async (req, res) => {
  try {
    if (req.body.group_ar) {
      const group_ar = req.body.group_ar;
      const jobs = await JobModel.find({ _id: { $in: group_ar } });
      res.json(jobs);
    } else {
      res.status(400).json({ err: "You need to send prop group_ar in the body" });
    }
  } catch (err) {
    console.error("Error fetching jobs by group:", err);
    res.status(502).json({ err });
  }
});

// יצירת משרה חדשה (בלי userId)
router.post("/", authAdmin, async (req, res) => {
  let validBody = validateJob(req.body); // לא כולל userId
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }

  try {
    let job = new JobModel({
      ...req.body,
      createdAt: new Date(),
    });
    await job.save();
    res.json(job);
  } catch (err) {
    console.error("Error adding job:", err);
    res.status(502).json({ err });
  }
});

router.put("/:id", authAdmin, async (req, res) => {
  let validBody = validateJob(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }

  try {
    let id = req.params.id;
    let job = await JobModel.updateOne({ _id: id }, req.body);
    res.json(job);
  } catch (err) {
    console.error("Error updating job:", err);
    res.status(502).json({ err });
  }
});

router.delete("/:id", authAdmin, async (req, res) => {
  try {
    let id = req.params.id;
    let job = await JobModel.deleteOne({ _id: id });
    res.json(job);
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(502).json({ err });
  }
});

router.get("/jobs/category/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const jobs = await JobModel.find({ category: { $regex: new RegExp(category, "i") } });
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs by category:", err);
    res.status(500).json({ err: "Failed to fetch jobs by category" });
  }
});

router.get("/jobs", auth, async (req, res) => {
  try {
    let jobs;
    if (["admin", "superadmin"].includes(req.tokenData.role)) {
      jobs = await JobModel.find().sort({ createdAt: -1 }).limit(100);
    } else {
      jobs = await JobModel.find().sort({ createdAt: -1 });
    }
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ err: "Failed to fetch jobs" });
  }
});

router.get("/cities", async (req, res) => {
  try {
    const response = await axios.get(
      "https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba"
    );
    const cities = response.data.result.records;
    if (!cities.length) {
      return res.status(404).send("No cities found.");
    }
    const cityList = cities
      .filter(city => city.שם_ישוב !== "לא רשום")
      .map(city => ({ value: city.שם_ישוב, label: city.שם_ישוב }))
      .sort((a, b) => a.label.localeCompare(b.label, "he"));
    res.json(cityList);
  } catch (err) {
    console.error("Error fetching cities:", err.message);
    res.status(500).send("Server Error");
  }
});

// יצירת משרה חדשה (בלי userId)
router.post('/jobs', async (req, res) => {
  const { title, description, location, requirements } = req.body;

  // בדיקת תקינות השדות
  try {
    const newJob = new Job({
      title,
      description,
      location,
      requirements,
    });

    const savedJob = await newJob.save();
    res.status(201).json(savedJob); // מחזיר את המשרה שנשמרה
  } catch (err) {
    res.status(500).json({ message: "Error adding job", error: err.message });
  }
});

module.exports = router;
