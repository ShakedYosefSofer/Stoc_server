const mongoose = require('mongoose');
const cron = require('node-cron');
require("dotenv").config();
const { JobModel } = require('../models/jobModel'); // מוודא שיבוא נכון של המודל

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/final_project');
  // await mongoose.connect(process.env.MONGO_CONNECT);
  console.log("mongo connect final project atlas");

  // משימת Cron למחיקת משרות ישנות
  cron.schedule('0 0 * * *', async () => {
    try {
      
      const twoWeeksAgo = new Date();
      //delete jobs older than 30 days aotumaticly
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 30);

      const result = await JobModel.deleteMany({ createdAt: { $lt: twoWeeksAgo } });
      console.log(`Deleted ${result.deletedCount} jobs older than 30 days.`);
    } catch (err) {
      console.error('Error deleting old jobs:', err);
    }
  });
}
