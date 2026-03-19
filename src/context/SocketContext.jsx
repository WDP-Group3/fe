import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const auth = useAuth();

  useEffect(() => {
    // Connect to socket server
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join user room when user logs in
  useEffect(() => {
    if (socket && auth?.user?.id) {
      socket.emit('join', auth.user.id);
      console.log('👤 Joined socket room for user:', auth.user.id);

      // Join admin room if user is admin
      if (auth.user.role === 'ADMIN') {
        socket.emit('join-admin');
        console.log('👑 Joined admin socket room');
      }
    }
  }, [socket, auth?.user?.id, auth?.user?.role]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('useSocket must be used within SocketProvider');
  }
  return context;
};
