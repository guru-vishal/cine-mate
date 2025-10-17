// Watch History Test - Run in browser console on any page
// This will test if watch history is working properly

const testWatchHistory = async () => {
  console.log('🧪 Testing Watch History Functionality');
  
  // Check if context is available
  if (typeof useMovie === 'undefined') {
    console.error('❌ MovieContext not available. Run this on a page with MovieContext.');
    return;
  }
  
  console.log('✅ MovieContext available');
  
  // Test movie data
  const testMovie = {
    id: 'test-123',
    title: 'Test Movie',
    poster_url: 'https://example.com/poster.jpg',
    rating: 8.5,
    year: '2023'
  };
  
  // Test localStorage
  console.log('📱 Testing localStorage...');
  localStorage.setItem('watchHistory', JSON.stringify([testMovie]));
  const localData = JSON.parse(localStorage.getItem('watchHistory'));
  console.log('✅ localStorage test:', localData);
  
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  console.log('👤 User status:', user ? 'Logged in' : 'Guest');
  
  if (user) {
    console.log('🔄 Testing backend API...');
    try {
      const response = await fetch(`http://localhost:5000/api/user/${user.id}/watch-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend API test successful:', data);
      } else {
        console.log('⚠️ Backend API response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Backend API test failed:', error);
    }
  }
  
  console.log('🏁 Test completed. Check above for results.');
};

// Auto-run the test
testWatchHistory();