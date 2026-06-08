import request from '../../Config/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddToCartProduct = async (variant, quantity) => {
    const token = document.cookie;

    if (!token) {
        return toast.error('Bạn Cần Đăng Nhập Trước !!!');
    }
    try {
        // variant is expected to be an object with id and maybe product info
        const { id } = variant;

        const res = await request.post('/api/addtocart', {
            productVariantId: id,
            quantity: quantity,
        });
        return res;
    } catch (error) {
        console.log(error);
    }
};

export default AddToCartProduct;
