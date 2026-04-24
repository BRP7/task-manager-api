import express from 'express';
import {getUsers , getUserById , registerUser, loginUser } from '../controllers/user.controller.js'

const router = express.Router();

// GET all users
router.get('/', getUsers );
router.post('/register',registerUser);
router.post('/login',loginUser)


// GET user by ID
router.get('/:id', getUserById);

export default router;