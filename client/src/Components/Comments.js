import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from '../Styles/Comments.module.scss';
import request from '../Config/api';
import getUploadUrl from '../utils/getUploadUrl';
import { useStore } from '../hooks/useStore';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faImage } from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';

const cx = classNames.bind(styles);

function Comments({ productId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [canComment, setCanComment] = useState(false);
    const [orderItemId, setOrderItemId] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [distribution, setDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { dataUser } = useStore();
    const reviewsPerPage = 5;

    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const res = await request.get('/api/reviews/product', {
                    params: { productId, page, limit: reviewsPerPage }
                });
                if (res.data && res.data.reviews) {
                    const reviews = res.data.reviews;
                    setComments(reviews);
                    const total = res.data.pagination?.total || reviews.length;
                    setTotalReviews(total);
                    setTotalPages(res.data.pagination?.pages || 1);

                    if (total > 0) {
                        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
                        setAverageRating(avg);

                        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                        reviews.forEach(r => {
                            if (dist[r.rating] !== undefined) dist[r.rating]++;
                        });
                        setDistribution(dist);
                    } else {
                        setAverageRating(0);
                    }
                }
            } catch (error) {
                console.error('Error fetching comments:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const checkCanComment = async () => {
            // Reset state when product changes
            setCanComment(false);
            setOrderItemId(null);

            if (dataUser?.id) {
                try {
                    const res = await request.get('/api/reviews/order-item-id', {
                        params: { userId: dataUser.id, productId }
                    });
                    if (res.data && res.data.orderItemId) {
                        setOrderItemId(res.data.orderItemId);
                        setCanComment(true);
                    }
                } catch (error) {
                    // Không hiển thị toast ở đây vì đây là kiểm tra "âm thầm"
                    // Thông báo "Bạn cần mua sản phẩm" sẽ được hiển thị ở UI
                    console.log('Không thể đánh giá sản phẩm này');
                }
            }
        };

        fetchComments();
        checkCanComment();
    }, [productId, dataUser, page]);

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

    const handleCommentSubmit = async () => {
        if (!canComment || !orderItemId) {
            toast.error('Bạn cần mua sản phẩm để đánh giá');
            return;
        }
        // Từ 3 sao trở xuống bắt buộc phải viết bình luận
        if (rating <= 3 && !newComment.trim()) {
            toast.error('Vui lòng viết bình luận khi đánh giá từ 3 sao trở xuống');
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
            setCanComment(false);
            setPage(1);

            const res = await request.get('/api/reviews/product', {
                params: { productId, page: 1, limit: reviewsPerPage }
            });
            if (res.data && res.data.reviews) {
                const reviews = res.data.reviews;
                setComments(reviews);
                const total = res.data.pagination?.total || reviews.length;
                setTotalReviews(total);
                setTotalPages(res.data.pagination?.pages || 1);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi gửi đánh giá');
            console.error('Error submitting review:', error);
        }
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    return (
        <div className={cx('comments-container')}>
            <h3>Đánh giá và bình luận</h3>

            <div className={cx('rating-summary')}>
                <div className={cx('summary-left')}>
                    <div className={cx('average-score')}>{averageRating.toFixed(1)}</div>
                    <div className={cx('stars-display')}>
                        {renderStars(Math.round(averageRating))}
                    </div>
                    <div className={cx('total-reviews')}>{totalReviews} đánh giá</div>
                </div>
                <div className={cx('summary-right')}>
                    {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className={cx('rating-row')}>
                            <span>{star} sao</span>
                            <div className={cx('progress-bar')}>
                                <div
                                    className={cx('progress-fill')}
                                    style={{
                                        width: totalReviews > 0 ? `${(distribution[star] / totalReviews) * 100}%` : '0%'
                                    }}
                                />
                            </div>
                            <span className={cx('count')}>{distribution[star]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {canComment && (
                <div className={cx('add-comment')}>
                    <h4>Viết đánh giá của bạn</h4>
                    <div className={cx('rating-select')}>
                        <label>Đánh giá của bạn: </label>
                        <div className={cx('stars-interactive')}>
                            {renderStars(rating, true)}
                        </div>
                    </div>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (tùy chọn)"
                        rows={4}
                    />
                    <button
                        onClick={handleCommentSubmit}
                        className={cx('submit-btn')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </div>
            )}

            {dataUser?.id && !canComment && (
                <div className={cx('cannot-comment')}>
                    <p>Bạn cần mua sản phẩm này để có thể đánh giá</p>
                </div>
            )}

            <div className={cx('comments-list')}>
                <h4>Danh sách đánh giá ({totalReviews})</h4>
                {isLoading && comments.length === 0 ? (
                    <div className={cx('loading')}>Đang tải...</div>
                ) : comments.length > 0 ? (
                    <>
                        {comments.map((comment) => (
                            <div key={comment.id} className={cx('comment')}>
                                <div className={cx('comment-header')}>
                                    <div className={cx('user-info')}>
                                        <div className={cx('avatar')}>
                                            {comment.User?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <strong>{comment.User?.fullname || 'Người dùng'}</strong>
                                            <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <div className={cx('comment-rating')}>
                                        {renderStars(comment.rating)}
                                    </div>
                                </div>
                                {comment.comment && (
                                    <p className={cx('comment-text')}>{comment.comment}</p>
                                )}
                                {comment.ReviewImages && comment.ReviewImages.length > 0 && (
                                    <div className={cx('comment-images')}>
                                        <span className={cx('images-label')}>
                                            <FontAwesomeIcon icon={faImage} /> Hình ảnh:
                                        </span>
                                        <div className={cx('images-grid')}>
                                            {comment.ReviewImages.map((img, index) => (
                                                <img
                                                    key={img.id || index}
                                                    src={getUploadUrl(img.url)}
                                                    alt={`Hình ảnh ${index + 1}`}
                                                    className={cx('review-image')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {totalPages > 1 && (
                            <div className={cx('pagination-wrapper')}>
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    handlePageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className={cx('no-comments')}>
                        <p>Chưa có bình luận nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Comments;