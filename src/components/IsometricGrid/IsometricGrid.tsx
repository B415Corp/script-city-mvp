import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Grid() {
  const gridSize = 20

  return (
    <>
      {/* Изометрическая сетка */}
      <gridHelper args={[gridSize, gridSize, '#888888', '#444444']} />
    </>
  )
}

export function IsometricGrid() {
  // Изометрическая камера: угол ~30 градусов сверху
  // Позиция рассчитывается для изометрического вида
  const cameraDistance = 20
  const angle = Math.PI / 6 // 30 градусов
  const cameraX = cameraDistance * Math.cos(angle) * Math.cos(Math.PI / 4)
  const cameraY = cameraDistance * Math.sin(angle)
  const cameraZ = cameraDistance * Math.cos(angle) * Math.sin(Math.PI / 4)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{
          position: [cameraX, cameraY, cameraZ],
          fov: 50,
        }}
        gl={{ antialias: true }}
      >
        {/* Настройка изометрической камеры */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, 10, -5]} intensity={0.4} />
        
        <Grid />
        
        {/* OrbitControls для управления камерой */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={50}
          // Ограничиваем вращение для сохранения изометрического вида
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 3}
        />
        
        {/* Вспомогательные оси */}
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  )
}

