import { useState } from 'react'
import { Menu } from './components/Menu'
import { SavesScreen } from './components/SavesScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { ModsScreen } from './components/ModsScreen'
import { GameWorld } from './components/GameWorld'
import { Screen } from './types/screen'




function App() {

const screens = [
  {
    name: Screen.MENU,
    component: Menu,
  },
  {
    name: Screen.NEW_WORLD,
    component: GameWorld,
  },
  {
    name: Screen.SAVES,
    component: SavesScreen,
  },
  {
    name: Screen.SETTINGS,
    component: SettingsScreen,
  },
  {
    name: Screen.MODS,
    component: ModsScreen,
  },
  
]


  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.MENU)

  const handleNewWorld = () => {
    setCurrentScreen(Screen.NEW_WORLD)
  }

  const handleSaves = () => {
    setCurrentScreen(Screen.SAVES)
  }

  const handleSettings = () => {
    setCurrentScreen(Screen.SETTINGS)
  }

  const handleMods = () => {
    setCurrentScreen(Screen.MODS)
  }

  const handleExit = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      window.close()
    }
  }

  const handleBack = () => {
    setCurrentScreen(Screen.MENU)
  }

  const ScreenComponent = screens.find(screen => screen.name === currentScreen)?.component as React.ComponentType<{ onBack: () => void, onNewWorld: () => void, onSaves: () => void, onSettings: () => void, onMods: () => void, onExit: () => void }>

  return (
    <ScreenComponent
      onBack={handleBack}
      onNewWorld={handleNewWorld}
      onSaves={handleSaves}
      onSettings={handleSettings}
      onMods={handleMods}
      onExit={handleExit}
    />
  );
}

export default App;
