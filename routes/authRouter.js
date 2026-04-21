const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const { validateSignUp } = require('../middleware/validate');

router.get("/sign-up", authController.getSignUp);
router.post("/sign-up", validateSignUp, authController.postSignUp);

router.get("/log-in", authController.getLogIn);
router.post("/log-in", passport.authenticate('local', {
    successRedirect: '/messages',
    failureRedirect: '/log-in',
}));

router.get("/log-out", authController.getLogOut);

module.exports = router;
