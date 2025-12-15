import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import Widget from './Widget'

const Root = () => {
    const [route, setRoute] = useState(window.location.hash)

    useEffect(() => {
        const onHashChange = () => setRoute(window.location.hash)
        window.addEventListener('hashchange', onHashChange)
        return () => window.removeEventListener('hashchange', onHashChange)
    }, [])

    if (route === '#widget') return <Widget />
    return <App />
}

createRoot(document.getElementById('root')!).render(
    <Root />
)
