// Utility để debug token
export const debugToken = () => {
  const tokenRaw = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  
  console.log('=== Token Debug ===');
  console.log('Token (raw):', tokenRaw);
  console.log('Token type:', typeof tokenRaw);
  
  if (tokenRaw) {
    try {
      const parsed = JSON.parse(tokenRaw);
      console.log('Token (parsed):', parsed);
      console.log('Parsed type:', typeof parsed);
    } catch (e) {
      console.log('Token is not JSON, it\'s a plain string');
    }
  }
  
  console.log('User (raw):', userRaw);
  console.log('==================');
};
