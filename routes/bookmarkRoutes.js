const express = require("express");
const router = express.Router();
const bookmarkController = require("../controllers/bookmarkController");
const { requireAuth } = require("../middleware/auth");
const { bookmarkNoteValidation } = require("../middleware/validators");

router.get("/bookmarks", bookmarkController.getBookmarksPage);
router.post(
  "/bookmarks",
  requireAuth,
  bookmarkNoteValidation,
  bookmarkController.postBookmark,
);
router.post(
  "/bookmarks/:id/edit",
  requireAuth,
  bookmarkNoteValidation,
  bookmarkController.postEditBookmark,
);
router.post(
  "/bookmarks/:id/delete",
  requireAuth,
  bookmarkController.postDeleteBookmark,
);
router.get("/about", bookmarkController.getAboutPage);

module.exports = router;
