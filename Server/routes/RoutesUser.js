const express = require('express');
const router = express.Router();

const ControllerUser = require('../controllers/ControllerUsers');
const ControllerJWT = require('../jwt/ControllerJWT');

router.post('/register', ControllerUser.Register);
router.post('/login', ControllerUser.Login);
router.post('/auth/google', ControllerUser.GoogleLogin);
router.get('/auth', ControllerJWT.verifyToken, ControllerUser.GetUser);
router.post('/logout', ControllerJWT.verifyToken, ControllerUser.Logout);
router.get('/getallorder', ControllerJWT.verifyToken, ControllerUser.GetOrder);
router.post('/forgotpassword', ControllerUser.ForgotPassword);
router.post('/resetpassword', ControllerUser.ResetPassword);
router.get('/refresh-token', ControllerUser.RefreshToken);

router.get('/getalluser', ControllerJWT.verifyTokenAdmin, ControllerUser.getAllUser);
router.delete('/deleteuser', ControllerJWT.verifyTokenAdmin, ControllerUser.DeleteUser);
router.post('/lockuser', ControllerJWT.verifyTokenAdmin, ControllerUser.LockUser);
router.post('/unlockuser', ControllerJWT.verifyTokenAdmin, ControllerUser.UnlockUser);

module.exports = router;
