import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'
import  User  from "../models/Users.js";
dotenv.config();

const {
//   GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET
} = process.env;

// Serialize user id into the session cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user object on each request with a valid session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

// Google
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       callbackURL: "/auth/google/callback"
//     },
//     async (_accessToken, _refreshToken, profile, done) => {
//       try {
//         const provider = "google";
//         const providerId = profile.id;
//         const email = profile.emails?.[0]?.value || null;
//         const name = profile.displayName || "";
//         const avatar = profile.photos?.[0]?.value || "";

//         let user = await User.findOne({ provider, providerId });
//         if (!user) {
//           user = await User.create({ provider, providerId, email, name, avatar });
//         }
//         return done(null, user);
//       } catch (e) {
//         return done(e);
//       }
//     }
//   )
// );

// GitHub

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
      scope: ["user:email"]
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const provider = "github";
        const providerId = profile.id;
        // GitHub emails can be empty unless scope allows; fetch primary if present
        const email =
          (Array.isArray(profile.emails) && profile.emails.find(e => e.primary)?.value) ||
          profile.emails?.[0]?.value ||
          null;
        const name = profile.displayName || profile.username || "";
        const avatar = profile.photos?.[0]?.value || "";

        let user = await User.findOne({ provider, providerId });
        if (!user) {
          user = await User.create({ provider, providerId, email, name, avatar });
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
        user.token = token
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  )
);

export default passport;
