const express = require("express");
const router = express.Router();
const discoveryController = require("../controllers/discoveryController");
const { requireAuth } = require("../middleware/auth");

router.get("/events", discoveryController.getEventsDirectory);
router.post(
  "/events/:id/join",
  requireAuth,
  discoveryController.postToggleRsvp,
);
router.get("/calendar", discoveryController.getCalendar);
router.get("/organizers", discoveryController.getOrganizersDirectory);
router.get("/organizers/:id", discoveryController.getOrganizersDirectory);

module.exports = router;
