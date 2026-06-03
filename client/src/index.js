import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { publicRoute } from './Route';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
        <Routes>
            {publicRoute.map((route, index) => {
                return <Route key={index} path={route.path} element={route.element} />;
            })}
        </Routes>
    </Router>
);
