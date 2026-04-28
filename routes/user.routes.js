import express from 'express';
import {getUsers , getUserById , registerUser, loginUser , getProfile , renamePrimaryTask} from '../controllers/user.controller.js'
import {auth} from "../middleware/auth.middleware.js";

const router = express.Router();

// GET all users
router.get('/', getUsers );
router.post('/register',registerUser);
router.post('/login',loginUser);
router.get('/profile',auth,getProfile);
router.patch('/primary/:id/rename',auth,renamePrimaryTask);


// GET user by ID
router.get('/:id', getUserById);

export default router;