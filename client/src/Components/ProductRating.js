import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import styles from '../Styles/ProductRating.module.scss';
import request from '../Config/api';
import { useStore } from '../hooks/useStore';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

function ProductRating({ productId }) {
    const [rating, setRating] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [canReview, setCanReview] = useState(false);
    const [orderItemId, setOrderItemId] = useState(null);
    const { dataUser } = useStore();

    useEffect(() => {
        const fetchRating = async () => {
            try {
                const res = await request.get('/api/reviews/product', { params: { productId } });
                if (res.data && res.data.reviews) {
                    const reviews = res.data.reviews;
                    const total = reviews.length;
                    const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
                    setAverageRating(avg);
                    setTotalReviews(total);
                }
            } catch (error) {
                console.error('Error fetching rating:', error);
            }
        };

        const checkCanReview = async () => {
            if (dataUser.id) {
                try {
                    const res = await request.get('/api/reviews/order-item-id', { params: { userId: dataUser.id, productId } });
                    if (res.data && res.data.orderItemId) {
                        setOrderItemId(res.data.orderItemId);
                        setCanReview(true);
                    }
                } catch (error) {
                    console.error('Error checking review permission:', error);
                }
            }
        };

        fetchRating();
        checkCanReview();
    }, [productId, dataUser]);

    const handleRatingSubmit = async () => {
        if (!canReview || !orderItemId) {
            toast.error('Bạn cần mua sản phẩm này để đánh giá');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('userId', dataUser.id);
            formData.append('productId', productId);
            formData.append('orderItemId', orderItemId);
            formData.append('rating', rating);
            formData.append('comment', ''); // Có thể thêm comment sau

            await request.post('/api/reviews/create', formData);
            toast.success('Đánh giá thành công');
            // Refresh rating
            const res = await request.get('/api/reviews/product', { params: { productId } });
            if (res.data && res.data.reviews) {
                const reviews = res.data.reviews;
                const total = reviews.length;
                const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
                setAverageRating(avg);
                setTotalReviews(total);
            }
            setCanReview(false); // Đã đánh giá rồi
        } catch (error) {
            toast.error('Lỗi khi đánh giá');
            console.error('Error submitting rating:', error);
        }
    };

    const renderStars = (rate, interactive = false) => {
        return Array.from({ length: 5 }, (_, i) => (
            <FontAwesomeIcon
                key={i}
                icon={faStar}
                className={cx('star', { filled: i < rate, interactive })}
                onClick={interactive ? () => setRating(i + 1) : undefined}
            />
        ));
    };

    return (
        <div className={cx('rating-container')}>
            <h3>Đánh giá sản phẩm</h3>
            <div className={cx('average-rating')}>
                <div className={cx('stars')}>
                    {renderStars(Math.round(averageRating))}
                </div>
                <span>{averageRating.toFixed(1)} / 5 ({totalReviews} đánh giá)</span>
            </div>
            {canReview && (
                <div className={cx('user-rating')}>
                    <p>Đánh giá của bạn:</p>
                    <div className={cx('stars')}>
                        {renderStars(rating, true)}
                    </div>
                    <button onClick={handleRatingSubmit} className={cx('submit-btn')}>Gửi đánh giá</button>
                </div>
            )}
        </div>
    );
}

export default ProductRating;