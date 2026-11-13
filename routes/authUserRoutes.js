const express = require("express");
const router = express.Router();
const authUserController = require("../controllers/authUserController");
const { requireAuth } = require("../middleware/auth");
const {
  loginValidation,
  registerValidation,
  profileEditValidation,
} = require("../middleware/validators");

router.get("/login", authUserController.getLogin);
router.post("/login", loginValidation, authUserController.postLogin);
router.get("/auth/switch", authUserController.switchDemoAccount);
router.get("/logout", authUserController.getLogout);
router.get("/register", authUserController.getRegister);
router.post("/register", registerValidation, authUserController.postRegister);
router.get("/api/users/check-email", authUserController.checkEmailAvailability);

router.get("/profile", requireAuth, authUserController.getProfile);
router.get("/profile/edit", requireAuth, authUserController.getProfileEdit);
router.post(
  "/profile/edit",
  requireAuth,
  profileEditValidation,
  authUserController.postProfileEdit,
);
router.post(
  "/profile/delete",
  requireAuth,
  authUserController.postProfileDelete,
);

module.exports = router;
