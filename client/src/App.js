import { useEffect } from 'react';
import './App.css';

function App() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="App">
            <h1>Client is running</h1>
        </div>
    );
}

export default App;
