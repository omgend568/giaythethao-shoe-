import LoginUser from '../Pages/Login';
import RegisterUser from '../Pages/RegisterUser';

export const publicRoute = [
    { path: '/login', element: <LoginUser /> },
    { path: '/register', element: <RegisterUser /> },
    { path: '*', element: <LoginUser /> },
];
