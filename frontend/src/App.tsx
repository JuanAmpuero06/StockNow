import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-4">StockNow</h1>
        <p className="text-gray-600 mb-6 text-lg">
          ¡Bienvenido a tu sistema de gestión de inventarios profesional!
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-green-500 font-semibold">
            <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
            <span>Entorno Frontend Configurado</span>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            Comenzar
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
