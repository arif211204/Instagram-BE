const express = require("express");
const notificationController = require("../controllers/notificationController");
const router = express.Router();

router.get("/receiver/:receiverId", notificationController.getAllByReceiverId.bind(notificationController));



module.exports = router;
