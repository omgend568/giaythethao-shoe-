import { useEffect, useState } from 'react';
import request from '../Config/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classNames from 'classnames/bind';
import styles from '../Styles/ManagePromotions.module.scss';
import Pagination from './Pagination';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const cx = classNames.bind(styles);

function ManagePromotions() {
    const [promotions, setPromotions] = useState([]);
    const [allPromotions, setAllPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [deletingPromotion, setDeletingPromotion] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discount_type: 'percent',
        discount_value: '',
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        usage_per_user: 1,
        start_date: '',
        end_date: '',
        is_active: true
    });

    const [validationWarnings, setValidationWarnings] = useState({});

    const rowsPerPage = 50;

    useEffect(() => {
        fetchPromotions();
    }, [filterStatus]);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const res = await request.get('/api/promotions/all', {
                params: { page: 1, limit: 1000, status: filterStatus !== 'all' ? filterStatus : undefined }
            });
            if (res.data && res.data.promotions) {
                setAllPromotions(res.data.promotions);
                setPage(1);
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
            toast.error('Lỗi khi tải danh sách khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(allPromotions.length / rowsPerPage);
    const startIndex = (page - 1) * rowsPerPage;
    const currentPromotions = allPromotions.slice(startIndex, startIndex + rowsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        let newWarnings = { ...validationWarnings };

        // Validate số âm cho các trường number
        if (type === 'number' && value && parseFloat(value) < 0) {
            newWarnings[name] = 'Giá trị không được nhỏ hơn 0';
        } else {
            delete newWarnings[name];
        }

        if (name === 'discount_value' && formData.discount_type === 'percent') {
            const numValue = parseInt(value) || 0;
            if (numValue > 100) {
                newWarnings.discount_value = 'Phần trăm giảm không nên vượt quá 100%';
            } else {
                delete newWarnings.discount_value;
            }
        }

        if (name === 'usage_limit') {
            const numValue = parseInt(value) || 0;
            if (numValue > 1000000) {
                newWarnings.usage_limit = 'Tổng lượt sử dụng quá lớn, có thể gây ảnh hưởng hiệu suất';
            } else {
                delete newWarnings.usage_limit;
            }
        }

        // Validate date range
        if ((name === 'start_date' || name === 'end_date')) {
            const newFormData = { ...formData, [name]: value };

            // Validate start_date >= today
            if (name === 'start_date' && value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = new Date(value);
                if (startDate < today) {
                    newWarnings.start_date = 'Ngày bắt đầu phải bằng hoặc lớn hơn ngày hiện tại';
                } else {
                    delete newWarnings.start_date;
                }
            }

            if (newFormData.start_date && newFormData.end_date) {
                if (new Date(newFormData.end_date) < new Date(newFormData.start_date)) {
                    newWarnings.date_range = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
                } else {
                    delete newWarnings.date_range;
                }
            }
        }

        setValidationWarnings(newWarnings);
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleNumberBlur = (e) => {
        const { name, value } = e.target;
        if (value && parseFloat(value) < 0) {
            toast.error(`${getFieldLabel(name)} không được nhỏ hơn 0`);
            setFormData({
                ...formData,
                [name]: 0
            });
        }
    };

    const getFieldLabel = (name) => {
        const labels = {
            discount_value: 'Giá trị giảm',
            max_discount_amount: 'Giảm tối đa',
            min_order_amount: 'Đơn hàng tối thiểu',
            usage_limit: 'Tổng lượt sử dụng',
            usage_per_user: 'Lượt sử dụng/user'
        };
        return labels[name] || name;
    };

    const openCreateModal = () => {
        setEditingPromotion(null);
        setValidationWarnings({});
        setFormData({
            name: '',
            description: '',
            discount_type: 'percent',
            discount_value: '',
            min_order_amount: '',
            max_discount_amount: '',
            usage_limit: '',
            usage_per_user: 1,
            start_date: '',
            end_date: '',
            is_active: true
        });
        setShowModal(true);
    };

    const openEditModal = (promotion) => {
        setEditingPromotion(promotion);
        setValidationWarnings({});
        setFormData({
            name: promotion.name || '',
            description: promotion.description || '',
            discount_type: promotion.discount_type || 'percent',
            discount_value: promotion.discount_value || '',
            min_order_amount: promotion.min_order_amount || '',
            max_discount_amount: promotion.max_discount_amount || '',
            usage_limit: promotion.usage_limit || '',
            usage_per_user: promotion.usage_per_user || 1,
            start_date: promotion.start_date?.split('T')[0] || '',
            end_date: promotion.end_date?.split('T')[0] || '',
            is_active: promotion.is_active
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.discount_value || !formData.start_date || !formData.end_date) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Validate start_date >= today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(formData.start_date);
        if (startDate < today) {
            toast.error('Ngày bắt đầu phải bằng hoặc lớn hơn ngày hiện tại');
            return;
        }

        // Validate date range
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            toast.error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
            return;
        }

        try {
            if (editingPromotion) {
                await request.put('/api/promotions/update', {
                    id: editingPromotion.id,
                    ...formData
                });
                toast.success('Cập nhật khuyến mãi thành công');
            } else {
                await request.post('/api/promotions/create', formData);
                toast.success('Tạo khuyến mãi thành công');
            }
            setShowModal(false);
            fetchPromotions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi lưu khuyến mãi');
        }
    };

    const handleDelete = async () => {
        if (!deletingPromotion) return;

        try {
            await request.delete('/api/promotions/delete', {
                params: { id: deletingPromotion.id }
            });
            toast.success('Xóa khuyến mãi thành công');
            setShowDeleteModal(false);
            fetchPromotions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa khuyến mãi');
        }
    };

    const handleToggleStatus = async (promotion) => {
        try {
            const res = await request.post('/api/promotions/toggle-status', {
                id: promotion.id
            });
            toast.success(res.data.message);
            fetchPromotions();
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusBadge = (promotion) => {
        const now = new Date();
        const start = new Date(promotion.start_date);
        const end = new Date(promotion.end_date);

        if (!promotion.is_active) {
            return <span className={cx('badge', 'badge-inactive')}>Đã tắt</span>;
        }
        if (now < start) {
            return <span className={cx('badge', 'badge-upcoming')}>Sắp diễn ra</span>;
        }
        if (now > end) {
            return <span className={cx('badge', 'badge-expired')}>Đã hết hạn</span>;
        }
        return <span className={cx('badge', 'badge-active')}>Đang hoạt động</span>;
    };

    return (
        <div className={cx('promotions-container')}>
            <ToastContainer />

            <div className={cx('header')}>
                <h3>Quản Lý Khuyến Mãi</h3>
                <button onClick={openCreateModal} className={cx('btn-create')}>
                    + Tạo Mã Khuyến Mãi
                </button>
            </div>

            <div className={cx('filters')}>
                <select
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPage(1);
                    }}
                    className={cx('filter-select')}
                >
                    <option value="all">Tất cả</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="upcoming">Sắp diễn ra</option>
                    <option value="expired">Đã hết hạn</option>
                </select>
            </div>

            {loading ? (
                <div className={cx('loading')}>Đang tải...</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Tên khuyến mãi</th>
                                    <th>Loại giảm</th>
                                    <th>Giá trị</th>
                                    <th>Đơn tối thiểu</th>
                                    <th>Đã dùng/Limit</th>
                                    <th>Thời gian</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPromotions.length > 0 ? (
                                    currentPromotions.map((promo) => (
                                        <tr key={promo.id}>
                                            <td>
                                                <code className={cx('promo-code')}>{promo.code}</code>
                                            </td>
                                            <td>{promo.name}</td>
                                            <td>
                                                {promo.discount_type === 'percent' ? 'Giảm %' : 'Giảm tiền'}
                                            </td>
                                            <td>
                                                {promo.discount_type === 'percent'
                                                    ? `${promo.discount_value}%`
                                                    : formatCurrency(promo.discount_value)}
                                                {promo.max_discount_amount && (
                                                    <small className={cx('max-discount')}>
                                                        (Max: {formatCurrency(promo.max_discount_amount)})
                                                    </small>
                                                )}
                                            </td>
                                            <td>{formatCurrency(promo.min_order_amount)}</td>
                                            <td>
                                                {promo.usage_count || 0}
                                                {promo.usage_limit ? ` / ${promo.usage_limit}` : ' / ∞'}
                                            </td>
                                            <td>
                                                <small>
                                                    {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                                                </small>
                                            </td>
                                            <td>{getStatusBadge(promo)}</td>
                                            <td>
                                                <div className={cx('action-buttons')}>
                                                    <button
                                                        onClick={() => openEditModal(promo)}
                                                        className={cx('btn-edit')}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeletingPromotion(promo);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className={cx('btn-delete')}
                                                    >
                                                        Xóa
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(promo)}
                                                        className={cx('btn-toggle', promo.is_active ? 'deactivate' : 'activate')}
                                                    >
                                                        {promo.is_active ? 'Tắt' : 'Bật'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center">
                                            Chưa có khuyến mãi nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

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
            )}

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingPromotion ? 'Sửa Khuyến Mãi' : 'Tạo Mã Khuyến Mãi Mới'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <div className="row">
                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Tên khuyến mãi *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="VD: Giảm 20% Tết 2026"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Mã coupon</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingPromotion?.code || 'Sẽ được tạo tự động'}
                                    disabled
                                    className="bg-light"
                                />
                                <Form.Text className="text-muted">
                                    Mã sẽ được tạo tự động (8 ký tự)
                                </Form.Text>
                            </Form.Group>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Mô tả chi tiết về khuyến mãi..."
                                rows={2}
                            />
                        </Form.Group>

                        <div className="row">
                            <Form.Group className="mb-3 col-md-4">
                                <Form.Label>Loại giảm *</Form.Label>
                                <Form.Select
                                    name="discount_type"
                                    value={formData.discount_type}
                                    onChange={handleInputChange}
                                >
                                    <option value="percent">Giảm theo %</option>
                                    <option value="fixed">Giảm số tiền cố định</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3 col-md-4">
                                <Form.Label>
                                    Giá trị giảm {formData.discount_type === 'percent' ? '(%)' : '(VNĐ)'} *
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="discount_value"
                                    value={formData.discount_value}
                                    onChange={handleInputChange}
                                    onBlur={handleNumberBlur}
                                    placeholder={formData.discount_type === 'percent' ? 'VD: 20' : 'VD: 50000'}
                                    required
                                    min="0"
                                    isInvalid={formData.discount_type === 'percent' && parseInt(formData.discount_value) > 100}
                                />
                                <Form.Text className={parseInt(formData.discount_value) > 100 ? 'text-danger' : 'text-muted'}>
                                    {validationWarnings.discount_value || (formData.discount_type === 'percent' ? 'Tối đa 100%' : 'Nhập số tiền giảm')}
                                </Form.Text>
                                {parseInt(formData.discount_value) <= 0 && formData.discount_value !== '' && (
                                    <div className="text-danger mt-1">Giá trị phải lớn hơn 0</div>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3 col-md-4">
                                <Form.Label>Giảm tối đa (VNĐ)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="max_discount_amount"
                                    value={formData.max_discount_amount}
                                    onChange={handleInputChange}
                                    onBlur={handleNumberBlur}
                                    placeholder="VD: 100000"
                                    min="0"
                                />
                                <Form.Text className="text-muted">
                                    Áp dụng khi giảm theo %
                                </Form.Text>
                            </Form.Group>
                        </div>

                        <div className="row">
                            <Form.Group className="mb-3 col-md-4">
                                <Form.Label>Đơn hàng tối thiểu (VNĐ)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="min_order_amount"
                                    value={formData.min_order_amount}
                                    onChange={handleInputChange}
                                    onBlur={handleNumberBlur}
                                    placeholder="VD: 200000"
                                    min="0"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3 col-md-4">
                                <Form.Label>Tổng lượt sử dụng</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="usage_limit"
                                    value={formData.usage_limit}
                                    onChange={handleInputChange}
                                    onBlur={handleNumberBlur}
                                    placeholder="Để trống = không giới hạn"
                                    min="0"
                                />
                                <Form.Text className={validationWarnings.usage_limit ? 'text-danger' : 'text-muted'}>
                                    {validationWarnings.usage_limit || 'Để trống = không giới hạn'}
                                </Form.Text>
                                {parseInt(formData.usage_limit) <= 0 && formData.usage_limit !== '' && (
                                    <div className="text-danger mt-1">Giá trị phải lớn hơn 0 hoặc để trống</div>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3 col-md-4">
                                <Form.Label>Lượt sử dụng/user</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="usage_per_user"
                                    value={formData.usage_per_user}
                                    onChange={handleInputChange}
                                    onBlur={handleNumberBlur}
                                    placeholder="Mỗi user dùng được mấy lần"
                                    min="0"
                                />
                            </Form.Group>
                        </div>

                        <div className="row">
                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Ngày bắt đầu *</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    required
                                    isInvalid={!!validationWarnings.start_date}
                                />
                                {validationWarnings.start_date && (
                                    <Form.Text className="text-danger">
                                        {validationWarnings.start_date}
                                    </Form.Text>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Ngày kết thúc *</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    required
                                    isInvalid={!!validationWarnings.date_range}
                                />
                                {validationWarnings.date_range && (
                                    <Form.Text className="text-danger">
                                        {validationWarnings.date_range}
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </div>

                        {(validationWarnings.date_range || validationWarnings.start_date) && (
                            <div className="alert alert-danger mb-3">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {validationWarnings.start_date || validationWarnings.date_range}
                            </div>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="is_active"
                                name="is_active"
                                label="Kích hoạt khuyến mãi"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <div className={cx('modal-footer')}>
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Hủy
                            </Button>
                            <Button variant="primary" type="submit">
                                {editingPromotion ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc chắn muốn xóa khuyến mãi "{deletingPromotion?.name}"?
                    <br />
                    <strong>Mã: {deletingPromotion?.code}</strong>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ManagePromotions;
