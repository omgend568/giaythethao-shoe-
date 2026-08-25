import request from '../../Config/api';
import cookies from 'js-cookie';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddToCartProduct = async (variant, quantity) => {
    if (cookies.get('logged') !== '1') {
        toast.error('Vui lòng đăng ký và đăng nhập để mua hàng');
        throw new Error('NOT_LOGGED_IN');
    }

    try {
        const { id } = variant;

        const res = await request.post('/api/addtocart', {
            productVariantId: id,
            quantity: quantity,
        });
        return res;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            throw error;
        }
        const message = error.response?.data?.message;
        if (message) {
            toast.error(message);
        } else {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
        }
        throw error;
    }
};

export default AddToCartProduct;
