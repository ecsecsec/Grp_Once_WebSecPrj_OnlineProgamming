import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

import './App.css'
import Footer from './setup/Footer'
import Header from './setup/Header'
import Home from './Screen/HomeScreen'
import Login from './Screen/login'
import SignUp from './Screen/signup'
import ProblemScreen from './Screen/ProblemScreen'
import ProblemDetailScreen from './Screen/ProblemDetailScreen'
import ContestScreen from './Screen/ContestScreen'
function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />

        <Route path='/problem' element={<ProblemScreen />}/>
        <Route path='/problem/:problemId' element={<ProblemDetailScreen />}/>
        <Route path='/contest' element={<ContestScreen />}/>
        <Route path='/login' element={<Login/>} />
        <Route path='/signup' element={<SignUp/>}/>
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
