const express = require("express");
const { authAdmin } = require("../middlewares/auth");
const { title } = require("process");
const router = express.Router();
const axios = require('axios');  // הוספת הייבוא של axios
const mongoose = require('mongoose');
const Joi = require('joi'); // או כל ספריית ולידציה אחרת אם תרצה
const CitiesModel = require('../models/citiesModel');

// API to fetch all cities from external API
router.get('/cities', async (req, res) => {
  try {
    const response = await axios.get('https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba');
    
    // הדפסת התשובה כדי לבדוק את מבנה הנתונים
    console.log('Response data:', response.data);
    
    // אנחנו מניחים שהערים נמצאות ב- response.data.result.records
    const cities = response.data.result.records;

    // אם אין ערים בתשובה
    if (cities.length === 0) {
      return res.status(404).send('No cities found.');
    }

   // הדפסת כל עיר כדי לבדוק אם יש ערך בשדה "שם_יישוב"
   cities.forEach(city => {
    console.log(city); // כאן תוכל לראות אם "שם_יישוב" קיים בערך
  });

  
    // מיפוי התוצאה כך שכוללת את שם העיר
    const cityList = cities.map(city => ({
      value: city.שם_ישוב_ ,  // שם העיר אם קיים, אחרת הצג "N/A"
      label: city.שם_ישוב   // אותו דבר עבור ה-label
    }));
    
    res.json(cityList); // שליחה ללקוח את הערים המפולטרות
  } catch (err) {
    console.error('Error fetching cities:', err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router; // דואג שהרוטים ייוצאו ויהיו זמינים ב-`app.js`


