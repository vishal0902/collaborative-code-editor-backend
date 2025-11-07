import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import ACTIONS from './Actions.js';
import dotenv from "dotenv";
// import authRouter from './middleware/auth.js';
import dbConnection from './dbConnection.js';
import MongoStore from 'connect-mongo';
import passport from './middleware/auth.js';
import cors from 'cors'
import session from 'express-session';
import userAuthRouter from './routes/userRouter.js';
import User from './models/Users.js';
import { authenticateToken, socketAuth } from './middleware/authjwt.js';
import runCodeRouter from './routes/runCodeRouter.js';

dotenv.config();

// import { fileURLToPath } from 'url';
// import path from 'path';



const app = express()
export const server = http.createServer(app)
const io = new Server(server)


const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

dbConnection();




const userToSocketMap = {};




const getJoinedClientList = async (roomId) => {
    const clients = await io.in(roomId).fetchSockets();
    return Array.from(clients.map((client)=>{
        return {
            socketId: client.id,
            username: userToSocketMap[client.id].username,
            avatar: userToSocketMap[client.id].avatar,
        }
    })); 
}


io.use(socketAuth);

io.on('connection',(socket)=>{
    console.log('Socket connected', socket.id)

    socket.on(ACTIONS.JOIN, async ({roomId, username, avatar})=>{
        socket.join(roomId);
        console.log(avatar);
        userToSocketMap[socket.id] = {username, avatar};
        // userToSocketMap[socket.id] =  username;
        const currentlyActiveClients = await getJoinedClientList(roomId);

        
        currentlyActiveClients.forEach(({socketId, username})=>{
            io.to(socketId).emit(ACTIONS.JOINED,{
                clients: currentlyActiveClients,
                username,
                socketId: socket.id,
            })
        })
      
    })


    socket.on(ACTIONS.CODE_CHANGE,({roomId, code})=>{
        console.log('receiving on server', code)
        io.to(roomId).emit(ACTIONS.CODE_CHANGE,{
            code,
            socketId: socket.id,
            username: userToSocketMap[socket.id].username
        })
    })

    socket.on(ACTIONS.SYNC_CODE,({socketId, code})=> {
        console.log('In sync code', socketId, 'the code to start: ', code);
        io.to(socketId).emit(ACTIONS.CODE_CHANGE,{
            code
        })
    })

    socket.on(ACTIONS.CODE_RUNNING, ({username, showOutputSection, roomId, runStatus, data}) =>{
        io.to(roomId).emit(ACTIONS.CODE_RUNNING,({
            username,
            showOutputSection,
            runStatus,
            data
        }))
    })

    socket.on(ACTIONS.CODE_COMPLETED, ({roomId, runStatus, data}) =>{
        io.to(roomId).emit(ACTIONS.CODE_COMPLETED,({
            runStatus,
            data
        }))
    })

    socket.on(ACTIONS.CLOSE_TERMINAL, ({roomId, showOutputSection}) =>{
        io.to(roomId).emit(ACTIONS.CLOSE_TERMINAL,({
            showOutputSection,
        }))
    })

    socket.on('disconnecting',()=> {
        const currentSocketRooms = [...socket.rooms];
        currentSocketRooms.map((roomId)=>{
            if(roomId === socket.id) return;
            console.log({socketId: socket.id, username: userToSocketMap[socket.id]})
            socket.to(roomId).emit(ACTIONS.DISCONNECTED,{
                socketId: socket.id,
                username: userToSocketMap[socket.id]
            })
        })

        delete userToSocketMap[socket.id];
        socket.leave();
    })

    socket.on(ACTIONS.CHANGE_LANGUAGE, ({roomId, languageMode}) => {
        io.to(roomId).emit(ACTIONS.CHANGE_LANGUAGE, ({
            languageMode,
            username: userToSocketMap[socket.id].username
        }))
    })
    


    
})





app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());


app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
      ttl: 1000 * 60 * 60 * 24 * 7 // 7 days
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",   // for cross-site GETs like OAuth redirect
      secure: false      // set true behind HTTPS/proxy in production
    }
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());
      



app.use("/api/auth/user", userAuthRouter);
app.use('/api/code', runCodeRouter);

app.get("/auth/github",
  passport.authenticate("github", { scope: ["user:email"] }),(req,res)=>{}
);

// GitHub OAuth callback
app.get("/auth/github/callback",
  passport.authenticate("github", { failureRedirect: `http://localhost:5173/signin` }),
  (req, res) => {
    const token  = req.user.token;
    // res.redirect(`http://localhost:5173/`);
    res.redirect(`http://localhost:5173/auth/success?token=${token}`);
  }
);

// Current user
app.get("/api/me", authenticateToken, (req, res) => {
  // req.user comes from deserializeUser
  res.json({ user: req.user || null });
});

// Logout
app.post("/auth/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(204).end();
    });
  });
});








// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


// app.use(express.static(path.join(__dirname, "./dist")));

// app.get('/{*any}', (req, res) => {
//   res.sendFile(path.join(__dirname, "./dist/index.html"));
// });




// const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>{
    console.log(`Server started running at ${PORT}`)
})
