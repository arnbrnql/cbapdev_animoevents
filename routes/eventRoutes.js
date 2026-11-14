const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const {
  requireAuth,
  requireOrganizer,
  requireEventOwner,
} = require("../middleware/auth");
const {
  eventCreateValidation,
  eventEditValidation,
  threadUpdateValidation,
} = require("../middleware/validators");

router.get("/", eventController.getHomeFeed);

// Static /events/new MUST come before parameterized /events/:id
router.get("/events/new", requireOrganizer, eventController.getEventCreate);
router.post(
  "/events",
  requireOrganizer,
  eventCreateValidation,
  eventController.postEventCreate,
);

router.get("/events/:id", eventController.getEventDetails);
router.get("/events/:id/edit", requireEventOwner, eventController.getEventEdit);
router.post(
  "/events/:id/edit",
  requireEventOwner,
  eventEditValidation,
  eventController.postEventEdit,
);
router.post(
  "/events/:id/delete",
  requireEventOwner,
  eventController.postEventDelete,
);

router.post(
  "/events/:id/updates",
  requireAuth,
  threadUpdateValidation,
  eventController.postThreadUpdate,
);
router.post(
  "/events/:id/updates/:updateId/edit",
  requireAuth,
  threadUpdateValidation,
  eventController.postEditThreadUpdate,
);
router.post(
  "/events/:id/updates/:updateId/delete",
  requireAuth,
  eventController.postDeleteThreadUpdate,
);

module.exports = router;
