import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <div className="flex justify-center gap-8 p-8">
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="h-24 transition-transform hover:scale-110" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="h-24 animate-spin-slow" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold text-center mb-8">Vite + React</h1>
      <div className="text-center">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 mb-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          count is {count}
        </button>
        <p className="mb-4">
          Edit <code className="px-2 py-1 bg-gray-100 rounded">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-center text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
