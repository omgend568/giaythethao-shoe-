import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { publicRoute } from './Route';
import { Provider } from './store/Provider';
import { GOOGLE_CLIENT_ID } from './Config/googleAuth';

if (!GOOGLE_CLIENT_ID) {
    console.error('Thiếu REACT_APP_GOOGLE_CLIENT_ID — tắt npm start, thêm vào client/.env rồi chạy lại.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Provider>
            <Router>
                <Routes>
                    {publicRoute.map((route, index) => {
                        return <Route key={index} path={route.path} element={route.element} />;
                    })}
                </Routes>
            </Router>
        </Provider>
    </GoogleOAuthProvider>
);
