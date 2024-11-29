const express = require("express");
const { getGeocode } = require("../controller/geocodeController");

const router = express.Router();

// Geocode 라우트
router.get("/", getGeocode);

module.exports = router;