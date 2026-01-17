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
import path from "path";
import * as Y from 'yjs'

dotenv.config();




const app = express()
export const server = http.createServer(app)
const io = new Server(server, {cors: {origin: "*"}});


const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;


dbConnection();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "../frontend/dist")));


// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
// });




const rooms = new Map();
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
    // console.log('Socket connected', socket.id)

    socket.on("join-room", async ({roomId, username, avatar}) =>{
        
        
        // console.log(`${username} joined the room: ${roomId}`);
        
        socket.join(roomId);

        if(!rooms.has(roomId)){
          rooms.set(roomId, new Y.Doc())
        }

        userToSocketMap[socket.id] = {username, avatar};
        
        const currentlyActiveClients = await getJoinedClientList(roomId);

        io.to(socket.id).emit("save-soketId", {userSocketId: socket.id});

        io.to(roomId).emit(ACTIONS.JOINED,{
                clients: currentlyActiveClients,
                username,
            })
        
        const ydoc = rooms.get(roomId)

        const  state = Y.encodeStateAsUpdate(ydoc)
        
        socket.emit("yjs-sync", Array.from(state))       
      
    })


    socket.on("yjs-update", ({ roomId, update }) => {
    const ydoc = rooms.get(roomId)
    if (!ydoc) return

    const binaryUpdate = new Uint8Array(update)
    Y.applyUpdate(ydoc, binaryUpdate)
    socket.to(roomId).emit("yjs-update", update)
    
    })


    socket.on("awareness-update", ({ roomId, update }) => {
      socket.to(roomId).emit("awareness-update", update)
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
    
    
    socket.on(ACTIONS.CHANGE_LANGUAGE, ({roomId, languageMode}) => {
        io.to(roomId).emit(ACTIONS.CHANGE_LANGUAGE, ({
            languageMode,
            username: userToSocketMap[socket.id].username
        }))
    })

    socket.on('disconnect',()=> {
        const currentSocketRooms = [...socket.rooms];
        
        // console.log( `${userToSocketMap[socket.id].username} has left the room.`)

        socket.broadcast.emit(ACTIONS.DISCONNECTED,{
                socketId: socket.id,
                username: userToSocketMap[socket.id].username
            })
        
        // currentSocketRooms.map((roomId)=>{
        //     if(roomId === socket.id) return;
        //     console.log({socketId: socket.id, username: userToSocketMap[socket.id].username})
            
        //     socket.broadcast(ACTIONS.DISCONNECTED,{
        //         socketId: socket.id,
        //         username: userToSocketMap[socket.id].username
        //     })
        // })

        delete userToSocketMap[socket.id];
        socket.leave();
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

// Current user
app.get("/api/me", authenticateToken, (req, res) => {
  // req.user comes from deserializeUser
  res.json({ user: req.user || null });
});

server.listen(PORT, () =>{
    console.log(`Server started running at ${PORT}`)
})


