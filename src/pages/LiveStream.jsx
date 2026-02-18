import { useState } from 'react'
import { Provider } from 'react-redux'
import { store } from '../redux/store'
import { useLiveSocket } from '../hooks/useLiveSocket'
import HomeView from '../components/live/HomeView'
import BroadcasterView from '../components/live/BroadcasterView'
import ViewerView from '../components/live/ViewerView'

function LiveStreamApp() {
  const [mode, setMode] = useState('home')
  const socket = useLiveSocket()

  if (mode === 'broadcaster')
    return <BroadcasterView onBack={() => setMode('home')} socket={socket} />

  if (mode === 'viewer')
    return <ViewerView onBack={() => setMode('home')} socket={socket} />

  return <HomeView onSelectMode={setMode} />
}

export default function LiveStreamPage() {
  return (
    <Provider store={store}>
      <LiveStreamApp />
    </Provider>
  )
}