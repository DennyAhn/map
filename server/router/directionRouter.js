const express = require("express");
const directionController = require("../controller/directionController");


const router = express.Router();

// Direction 라우트
router.get('/normal-direction', directionController.getNormalRoute);
router.get('/safe-direction', directionController.getSafeRoute);

module.exports = router;