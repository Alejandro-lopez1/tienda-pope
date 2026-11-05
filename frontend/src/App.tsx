import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Popé</h1>
        <p className="text-xl text-white/90 mb-8">Tienda Online - Fase 1 en Construcción</p>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-primary-600 mb-4">✓ Fundaciones Inicializadas</h2>
          <ul className="text-left space-y-2 text-gray-700">
            <li>✓ Docker Compose configurado</li>
            <li>✓ Django REST Framework setup</li>
            <li>✓ React + Vite + TypeScript</li>
            <li>✓ Tailwind CSS integrado</li>
            <li>✓ Estructura de carpetas lista</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
