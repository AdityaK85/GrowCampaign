import dotenv from "dotenv";
dotenv.config();

import * as client from "openid-client";
// import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { jwtDecode } from "jwt-decode";
import * as GoogleStrategy from 'passport-google-oauth20';
import { UpsertUser, User } from "@shared/schema";
// Ensure all environment variables are defined
if (
  !process.env.REPL_ID ||
  !process.env.ISSUER_URL ||
  !process.env.SESSION_SECRET ||
  !process.env.DATABASE_URL ||
  !process.env.CLIENT_SECRET
) {
  throw new Error("Missing required environment variables");
}


const GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";

// Cache OIDC configuration
const getOidcConfig = memoize(
  async () => {
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL!),
      process.env.REPL_ID!
    );
    return config;
  },
  { maxAge: 3600 * 1000 } // Cache for 1 hour
);

// Session setup with PostgreSQL store
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Update user session with token data
// function updateUserSession(user: any, tokens: { access_token: string; refresh_token: string; expires_in: number; id_token: string }) {
//   user.claims = jwtDecode(tokens.id_token);
//   user.access_token = tokens.access_token;
//   user.refresh_token = tokens.refresh_token;
//   user.expires_at = Date.now() + tokens.expires_in * 1000;
// }

function updateUserSession(user: any, tokens: any) {
  if (!tokens.id_token) {
    throw new Error('ID token is missing from the token response');
  }

  user.claims = jwtDecode(tokens.id_token);
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Store user in DB
async function upsertUser(claims: any) {

  const user = claims._json ?? claims; // fallback if already using _json directly

  if (!user.sub) {
    throw new Error('Missing user id (sub) in claims');
  }

  await storage.upsertUser({
    id: user.sub,
    email: user.email,
    firstName: user.given_name || user.first_name,
    lastName: user.family_name || user.last_name,
    profileImageUrl: user.picture || user.profile_image_url,
  });
}

// Setup Passport OIDC authentication strategy
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify = async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: passport.AuthenticateCallback
    ) => {
      const user: any = {};

      // Set user info in session
      user.claims = profile._json;; // Google profile will give you the user claims directly
      user.access_token = accessToken;
      user.refresh_token = refreshToken;

      // Upsert user in the database
      await upsertUser(user.claims);

      // Return the user
      done(null, user);
    };
  

  const googleStrategy = new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
      scope: ['openid', 'email', 'profile'],
      passReqToCallback: true,  // Set this to true to match the expected type
    },
    (req, accessToken, refreshToken, profile, done) => {
      // Now you have access to the `req` object here
      const user: any = {};

      // You can use the `req` object for any custom logic you need
      user.claims = profile; // Google profile will give you the user claims directly
      user.access_token = accessToken;
      user.refresh_token = refreshToken;

      // Upsert user in the database (example)
      upsertUser(profile);  // Assuming you have a function for this
      // Call done() to complete the authentication
      return done(null, user);
    }
  );

  // Use the GoogleStrategy with Passport
  passport.use(googleStrategy);
  
  passport.serializeUser((user: any, cb) => {
    const sub = user.claims?._json?.sub || user.claims?.id;
    if (!sub) {
      return cb(new Error("User sub ID not found in claims"), null);
    }
    cb(null, sub); // Just store the sub string in session
  });
  passport.deserializeUser(async (sub: string, cb) => {

    try {
      const user = await storage.getUser(sub);  

      if (!user) {
        return cb(new Error('User not found in DB and cannot create from session'), null);
      }
      cb(null, user);
    } catch (error) {
      cb(error, null);
    }
  });

  app.get(
    "/api/login",
    passport.authenticate("google", {
      prompt: "login consent",
      scope: ["openid", "email", "profile"],
    })
  );

  app.get(
    "/api/callback",
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/login-failed",
      failureMessage: true,
    })
  );

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout Error:", err);
        return res.status(500).send("Logout failed");
      }

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session Destroy Error:", err);
        }

        // Clear cookie and redirect to home or login page
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: false, // set true in production with HTTPS
        });

        return res.redirect("/");
      });
    });
  });


};

// Middleware to ensure user is authenticated and refresh tokens if expired
export const isAuthenticated: RequestHandler = (req, res, next) => {

  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};
