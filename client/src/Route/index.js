import App from '../App';
import Admin from '../Pages/Admin';
import LoginUser from '../Pages/Login';
import RegisterUser from '../Pages/RegisterUser';

export const publicRoute = [
    { path: '/', element: <App /> },
    { path: '/login', element: <LoginUser /> },
    { path: '/register', element: <RegisterUser /> },
    { path: '/admin', element: <Admin /> },
    { path: '*', element: <App /> },
];
