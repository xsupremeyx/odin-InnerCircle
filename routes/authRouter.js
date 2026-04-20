const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');
const passport = require('passport');

router.get("/sign-up", authController.getSignUp);
router.post("/sign-up", authController.postSignUp);

router.get("/log-in", authController.getLogIn);
router.post("/log-in", passport.authenticate('local', {
    successRedirect: '/messages',
    failureRedirect: '/log-in',
}));

router.get("/log-out", authController.getLogOut);

module.exports = router;
