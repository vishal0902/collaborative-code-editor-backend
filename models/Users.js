// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

// const userSchema = new mongoose.Schema({
    
//     username: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     email: {
//         type: String,
//         required: true,
//     },
//     password: {
//         type: String,
//         required: true,
//         minlength: 8,
//         select: false,
//         maxlength: 60,        
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
//     updatedAt: {
//         type: Date,
//         default: Date.now,
//     },
// })

// userSchema.pre('save', async function(next) {
//     if(!this.isModified('password')) {
//         return next();
//     }
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
// });

// userSchema.methods.comparePassword = async function(password) {
//     return await bcrypt.compare(password, this.password);
// };

// userSchema.methods.generateToken = function() {
//     return jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
// };

// const User = mongoose.model('User', userSchema);

// export default User; 




import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    provider: { type: String, default: null},       // 'google' | 'github'
    providerId: { type: String, default: null },     // OAuth account id
    email: { type: String, index: true },
    name: String,
    avatar: String,
    password: String
  },
  { timestamps: true }
);

// userSchema.index({ provider: 1, providerId: 1 }, { unique: true });
userSchema.index(
  { provider: 1, providerId: 1 },
  {
    unique: true,
    partialFilterExpression: { provider: { $ne: null } }
  }
);

const User = mongoose.model("User", userSchema);
export default User;
