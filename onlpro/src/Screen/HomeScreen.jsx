import { useState, useEffect } from "react";


function Home() {
    const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/hello')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setMessage(data.message);
        setError('');
      })
      .catch(err => {
        console.error('Lỗi khi gọi API:', err);
        setMessage('');
        setError('Lỗi kết nối backend: ' + err.message);
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to Homepage</h1>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>Backend says: {message}</p>
      )}
    </div>
  );
}

export default Home;
