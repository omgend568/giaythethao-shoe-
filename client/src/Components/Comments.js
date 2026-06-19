import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from '../Styles/Comments.module.scss';
import request from '../Config/api';
import getUploadUrl from '../utils/getUploadUrl';
import { useStore } from '../hooks/useStore';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function Comments({ productId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [canComment, setCanComment] = useState(false);
    const [orderItemId, setOrderItemId] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const { dataUser } = useStore();

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await request.get('/api/reviews/product', { params: { productId } });
                if (res.data && res.data.reviews) {
                    const reviews = res.data.reviews;
                    setComments(reviews);
                    const total = reviews.length;
                    const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
                    setAverageRating(avg);
                    setTotalReviews(total);
                }
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        };

        const checkCanComment = async () => {
            if (dataUser.id) {
                try {
                    const res = await request.get('/api/reviews/order-item-id', { params: { userId: dataUser.id, productId } });
                    if (res.data && res.data.orderItemId) {
                        setOrderItemId(res.data.orderItemId);
                        setCanComment(true);
                    }
                } catch (error) {
                    console.error('Error checking comment permission:', error);
                }
            }
        };

        fetchComments();
        checkCanComment();
    }, [productId, dataUser]);

    const renderStars = (rate) => {
        return Array.from({ length: 5 }, (_, i) => (
            <FontAwesomeIcon
                key={i}
                icon={faStar}
                className={cx('star', { filled: i < rate })}
            />
        ));
    };

    const handleCommentSubmit = async () => {
        if (!canComment || !orderItemId) {
            toast.error('Bạn cần mua sản phẩm để đánh giá');
            return;
        }
        if (!newComment.trim() && rating === 5) {
            toast.error('Vui lòng nhập bình luận hoặc chọn đánh giá khác');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('userId', dataUser.id);
            formData.append('productId', productId);
            formData.append('orderItemId', orderItemId);
            formData.append('rating', rating);
            formData.append('comment', newComment);

            await request.post('/api/reviews/create', formData);
            toast.success('Đánh giá và bình luận thành công');
            setNewComment('');
            setRating(5);
            // Refresh comments
            const res = await request.get('/api/reviews/product', { params: { productId } });
            if (res.data && res.data.reviews) {
                const reviews = res.data.reviews;
                setComments(reviews);
                const total = reviews.length;
                const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
                setAverageRating(avg);
                setTotalReviews(total);
            }
            setCanComment(false); // Đã review rồi
        } catch (error) {
            toast.error('Lỗi khi gửi đánh giá');
            console.error('Error submitting review:', error);
        }
    };

    return (
        <div className={cx('comments-container')}>
            <h3>Đánh giá và bình luận</h3>
            <div className={cx('average-rating')}>
                <div className={cx('stars')}>
                    {renderStars(Math.round(averageRating))}
                </div>
                <span>{averageRating.toFixed(1)} / 5 ({totalReviews} đánh giá)</span>
            </div>
            {canComment && (
                <div className={cx('add-comment')}>
                    <div className={cx('rating-select')}>
                        <label>Đánh giá: </label>
                        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                            <option value={1}>1 sao</option>
                            <option value={2}>2 sao</option>
                            <option value={3}>3 sao</option>
                            <option value={4}>4 sao</option>
                            <option value={5}>5 sao</option>
                        </select>
                    </div>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết bình luận của bạn... (tùy chọn)"
                        rows={4}
                    />
                    
                    <button onClick={handleCommentSubmit} className={cx('submit-btn')}>Gửi đánh giá</button>
                </div>
            )}
            <div className={cx('comments-list')}>
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className={cx('comment')}>
                            <div className={cx('comment-header')}>
                                <strong>{comment.User?.fullname || 'Người dùng'}</strong>
                                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className={cx('comment-rating')}>
                                {renderStars(comment.rating)}
                            </div>
                            <p>{comment.comment}</p>
                            {comment.ReviewImages && comment.ReviewImages.length > 0 && (
                                <div className={cx('comment-images')}>
                                    {comment.ReviewImages.map((img) => (
                                        <img key={img.id} src={getUploadUrl(img.url)} alt="" />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>Chưa có bình luận nào.</p>
                )}
            </div>
        </div>
    );
}

export default Comments;