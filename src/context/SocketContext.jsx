import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const auth = useAuth();

  useEffect(() => {
    // Lấy origin root từ VITE_API_URL (vd: http://localhost:3000/api -> http://localhost:3000)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
