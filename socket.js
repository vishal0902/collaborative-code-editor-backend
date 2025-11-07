// import { Server } from "socket.io";
// import { server } from "./server";
// import ACTIONS from "./Actions";

// const io = new Server(server)

// const userToSocketMap = {};


// const getJoinedClientList = async (roomId) => {
//     const clients = await io.in(roomId).fetchSockets();
//     return Array.from(clients.map((client)=>{
//         return {
//             socketId: client.id,
//             username: userToSocketMap[client.id]
//         }
//     })); 
// }


// io.on('connection',(socket)=>{
//     console.log('Socket connected', socket.id)

//     socket.on(ACTIONS.JOIN, async ({roomId, username})=>{
//         socket.join(roomId);
//         // console.log(avatar);
//         userToSocketMap[socket.id] = username;
//         // userToSocketMap[socket.id] =  username;
//         const currentlyActiveClients = await getJoinedClientList(roomId);

        
//         currentlyActiveClients.forEach(({socketId, username})=>{
//             io.to(socketId).emit(ACTIONS.JOINED,{
//                 clients: currentlyActiveClients,
//                 username,
//                 socketId: socket.id,
//             })
//         })
      
//     })


//     socket.on(ACTIONS.CODE_CHANGE,({roomId, code})=>{
//         console.log('receiving on server', code)
//         socket.to(roomId).emit(ACTIONS.CODE_CHANGE,{
//             code,
//             socketId: socket.id
//         })
//     })

//     socket.on(ACTIONS.SYNC_CODE,({socketId, code})=> {
//         console.log('In sync code', socketId, 'the code to start: ', code);
//         socket.to(socketId).emit(ACTIONS.CODE_CHANGE,{
//             code
//         })
//     })

//     socket.on('disconnecting',()=> {
//         const currentSocketRooms = [...socket.rooms];
//         currentSocketRooms.map((roomId)=>{
//             if(roomId === socket.id) return;
//             console.log({socketId: socket.id, username: userToSocketMap[socket.id]})
//             socket.to(roomId).emit(ACTIONS.DISCONNECTED,{
//                 socketId: socket.id,
//                 username: userToSocketMap[socket.id]
//             })
//         })

//         delete userToSocketMap[socket.id];
//         socket.leave();
//     })


    
// })
