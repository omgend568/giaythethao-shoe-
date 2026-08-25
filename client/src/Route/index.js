import { Navigate } from 'react-router-dom';
import App from '../App';
import Admin from '../Pages/Admin';
import Cart from '../Pages/Cart';
import Category from '../Pages/Category';
import DetailProducts from '../Pages/DetailProducts';
import SearchResults from '../Pages/SearchResults';
import InfoUser from '../Pages/InfoUser';
import LoginUser from '../Pages/Login';
import ForgotPassword from '../Pages/ForgotPassword';
import SetNewPassword from '../Pages/SetNewPassword';
import PaymentSuccess from '../Pages/PaymentSuccess';
import Payments from '../Pages/Payments';
import RegisterUser from '../Pages/RegisterUser';

export const publicRoute = [
    { path: '/', element: <Navigate to="/home" replace /> },
    { path: '/home', element: <App /> },
    { path: '/product/:id/:slug', element: <DetailProducts /> },
    { path: '/category', element: <Category /> },
    { path: '/category/:slug', element: <Category /> },
    { path: '/search', element: <SearchResults /> },
    { path: '/cart', element: <Cart /> },
    { path: '/payments', element: <Payments /> },
    { path: '/login', element: <LoginUser /> },
    { path: '/forgotPassword', element: <ForgotPassword /> },
    { path: '/reset-password', element: <SetNewPassword /> },
    { path: '/register', element: <RegisterUser /> },
    { path: '/info', element: <InfoUser /> },
    { path: '/admin', element: <Admin /> },
    { path: '/paymentsuccess', element: <PaymentSuccess /> },
    { path: '*', element: <Navigate to="/home" replace /> },
];