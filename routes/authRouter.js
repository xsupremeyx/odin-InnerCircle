const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const { validateSignUp } = require('../middleware/validate');
const { ensureLoggedIn } = require('../middleware/auth');



router.get("/sign-up", authController.getSignUp);
router.post("/sign-up", validateSignUp, authController.postSignUp);

router.get("/log-in", authController.getLogIn);
router.post("/log-in", passport.authenticate('local', {
    successRedirect: '/messages',
    failureRedirect: '/log-in',
    failureFlash: true,
}));

router.get("/log-out", authController.getLogOut);

router.get("/join", ensureLoggedIn, authController.getJoinForm);
router.post("/join", ensureLoggedIn, authController.postJoinForm);

module.exports = router;
