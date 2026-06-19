import { Navigate } from 'react-router-dom';
import App from '../App';
import Admin from '../Pages/Admin';
import Cart from '../Pages/Cart';
import Category from '../Pages/Category';
import DetailProducts from '../Pages/DetailProducts';
import SearchResults from '../Pages/SearchResults';
import LoginUser from '../Pages/Login';
import RegisterUser from '../Pages/RegisterUser';

export const publicRoute = [
    { path: '/', element: <Navigate to="/home" replace /> },
    { path: '/home', element: <App /> },
    { path: '/product/:id/:slug', element: <DetailProducts /> },
    { path: '/category', element: <Category /> },
    { path: '/category/:slug', element: <Category /> },
    { path: '/search', element: <SearchResults /> },
    { path: '/cart', element: <Cart /> },
    { path: '/login', element: <LoginUser /> },
    { path: '/register', element: <RegisterUser /> },
    { path: '/admin', element: <Admin /> },
    { path: '*', element: <Navigate to="/home" replace /> },
];