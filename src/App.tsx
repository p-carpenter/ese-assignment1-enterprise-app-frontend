import { useState } from 'react';
import { SongList } from './components/SongList';
import { SongUploadForm } from './components/SongForm'
import { MusicPlayer } from './components/MusicPlayer'

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
      setRefreshKey(prev => prev + 1); // Forces MusicPlayer to re-fetch songs
  };

return (
    <div className="app">
      <h1>My Enterprise Music App</h1>
      
      <SongUploadForm onUploadSuccess={handleUploadSuccess} />
      
      <hr />
      
      <MusicPlayer keyTrigger={refreshKey} />
    </div>
  );
}

export default App;