const express = require("express");
const { DrushimModel, validateDrushim } = require("../models/drushimModel"); // Ensure correct naming
const { authAdmin } = require("../middlewares/auth");
const router = express.Router();
const axios = require('axios');  // הוספת הייבוא של axios
const mongoose = require('mongoose');

// Get all drushim, with a limit of 20 results
router.get("/", async (req, res) => {
  try {
    const drushim = await DrushimModel.find({}).limit(20);
    res.json(drushim);
  } catch (err) {
    console.error("Error fetching drushim:", err);
    res.status(502).json({ err: 'Failed to fetch drushim' });
  }
});

// Get a specific drushim by ID
router.get("/single/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const drushim = await DrushimModel.findById(id);
    if (!drushim) {
      return res.status(404).json({ error: "Drushim not found" });
    }
    res.json(drushim);
  } catch (err) {
    console.error("Error fetching drushim:", err);
    res.status(502).json({ err: 'Failed to fetch drushim' });
  }
});

// Create a new drushim entry
router.post("/", authAdmin, async (req, res) => {
  const { error } = validateDrushim(req.body);
  if (error) {
    return res.status(400).json({ error: 'Validation error', details: error.details });
  }
  try {
    const { title, description, requirements, salary, location } = req.body; 
    const drushim = new DrushimModel({ title, description, requirements, salary, location });
    await drushim.save();
    res.json(drushim);
  } catch (err) {
    console.error("Error adding drushim:", err);
    res.status(502).json({ err: 'Failed to add drushim' });
  }
});

// Update an existing drushim entry by ID
router.put("/:id", authAdmin, async (req, res) => {
  const { error } = validateDrushim(req.body);
  if (error) {
    return res.status(400).json({ error: 'Validation error', details: error.details });
  }
  try {
    const { title, description, requirements, salary, location } = req.body; // כולל השדות החדשים
    const id = req.params.id;
    const updatedDrushim = await DrushimModel.findByIdAndUpdate(
      id,
      { title, description, requirements, salary, location },
      { new: true }
    );
    if (!updatedDrushim) {
      return res.status(404).json({ error: "Drushim not found" });
    }
    res.json(updatedDrushim);
  } catch (err) {
    console.error("Error updating drushim:", err);
    res.status(502).json({ err: 'Failed to update drushim' });
  }
});

// Delete a drushim entry by ID
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const deletedDrushim = await DrushimModel.findByIdAndDelete(id);
    if (!deletedDrushim) {
      return res.status(404).json({ error: "Drushim not found" });
    }
    res.json(deletedDrushim);
  } catch (err) {
    console.error("Error deleting drushim:", err);
    res.status(502).json({ err: 'Failed to delete drushim' });
  }
});

// שליפת כל המשרות לפי קטגוריה
router.get('/drushim/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const drushim = await DrushimModel.find({ title: category }); // חפש משרות לפי קטגוריה
    res.json(drushim);
  } catch (err) {
    console.error("Error fetching drushim by category:", err);
    res.status(500).json({ err: "Failed to fetch drushim by category" });
  }
});

// שליפת כל המשרות בסדר יורד (מהסוף להתחלה)
router.get('/drushim', async (req, res) => {
  try {
    const drushim = await DrushimModel.find().sort({ _id: 1 }).limit(100);
    res.json(drushim);
  } catch (err) {
    console.error("Error fetching all drushim:", err);
    res.status(500).json({ err: "Failed to fetch all drushim" });
  }
});

// API to fetch all cities from external API
router.get('/cities', async (req, res) => {
  try {
    const response = await axios.get('https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba');

    const cities = response.data.result.records;

    if (cities.length === 0) {
      return res.status(404).send('No cities found.');
    }

    const cityList = cities
      .filter(city => city.שם_ישוב !== 'לא רשום') // סינון ערים עם השם "לא רשום"
      .map(city => ({
        value: city.שם_ישוב,
        label: city.שם_ישוב
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'he'));

    res.json(cityList);
  } catch (err) {
    console.error('Error fetching cities:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;