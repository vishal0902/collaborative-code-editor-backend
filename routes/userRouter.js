import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import bcrypt from 'bcrypt';



const userAuthRouter = express.Router();

userAuthRouter.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if(existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
    res.status(201).json(token);
});


userAuthRouter.post('/login', async(req, res)=> {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(user) {
        const result = bcrypt.compare(password, user.password);
        if(result) {
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
            return res.status(200).json(token)
        }
    }
        return res.status(401).json({error: true, message: 'invalid credentials.'})
})

export default userAuthRouter;