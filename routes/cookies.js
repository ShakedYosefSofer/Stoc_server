const express = require("express");
const router = express.Router();

// הגדרת ראוטר של הרואט שנגדיר באפ
router.get("/", async (req, res) => {
  res.json({ msg: "cookies" });
});

router.get("/check", async (req, res) => {
  if (req.cookies["myCookie"]) {
    res.json({ msg: req.cookies["myCookie"] });
  } else {
    res.json({ msg: "no cookies" });
  }
});



router.post("/", async (req, res) => {
  res
    .cookie("myCookie", "Hello cookie val", {
      httpOnly: false,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 ),
    })
    .json({ msg: "cookies created" });
});

router.delete("/", async (req, res) => {
  res.clearCookie("myCookie").json({ msg: "deleted cookie" });
});

// export default
module.exports = router;
