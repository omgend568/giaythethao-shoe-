import classNames from 'classnames/bind';
import styles from '../Styles/ManageStatistics.module.scss';
import { useEffect, useState } from 'react';
import request from '../Config/api';
import ChartLine from '../Components/ChartLine';

const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

// Hàm định dạng ngày
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
};

function ManageStatistics() {
    const [overview, setOverview] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalProductsSold: 0,
        avgOrderValue: 0
    });
    const [brandStats, setBrandStats] = useState([]);
    const [soldProducts, setSoldProducts] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [brandDetail, setBrandDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Fetch overview statistics
    const fetchOverview = async () => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await request.get('/api/statistics/overview', { params });
            setOverview(response.data);
        } catch (error) {
            console.error('Error fetching overview:', error);
        }
    };

    // Fetch sales by brand
    const fetchBrandStats = async () => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await request.get('/api/statistics/by-brand', { params });
            setBrandStats(response.data);
        } catch (error) {
            console.error('Error fetching brand stats:', error);
        }
    };

    // Fetch sold products
    const fetchSoldProducts = async () => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (selectedBrand) params.brandId = selectedBrand;

            const response = await request.get('/api/statistics/sold-products', { params });
            setSoldProducts(response.data);
        } catch (error) {
            console.error('Error fetching sold products:', error);
        }
    };

    // Fetch brand detail
    const fetchBrandDetail = async (brandId) => {
        try {
            const params = { brandId };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await request.get('/api/statistics/brand-detail', { params });
            setBrandDetail(response.data);
        } catch (error) {
            console.error('Error fetching brand detail:', error);
        }
    };

    // Handle filter apply
    const handleApplyFilter = () => {
        fetchOverview();
        fetchBrandStats();
        fetchSoldProducts();
    };

    // Handle brand click
    const handleBrandClick = (brandId) => {
        setSelectedBrand(brandId);
        fetchBrandDetail(brandId);
    };

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([
                fetchOverview(),
                fetchBrandStats(),
                fetchSoldProducts()
            ]);
            setLoading(false);
        };
        fetchData();
    }, []);

    // Refresh sold products when brand or date filter changes
    useEffect(() => {
        if (activeTab === 'products') {
            fetchSoldProducts();
        }
    }, [selectedBrand, startDate, endDate]);

    // Refresh brand detail when brand changes
    useEffect(() => {
        if (selectedBrand) {
            fetchBrandDetail(selectedBrand);
        }
    }, [selectedBrand]);

    if (loading) {
        return (
            <div className={cx('loading')}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('manage-statistics')}>
            <h2 className={cx('title')}>Quản Lý Thống Kê Doanh Thu</h2>

            {/* Filter Section */}
            <div className={cx('filter-section')}>
                <div className={cx('filter-group')}>
                    <label>Từ ngày:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="form-control"
                    />
                </div>
                <div className={cx('filter-group')}>
                    <label>Đến ngày:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="form-control"
                    />
                </div>
                <button onClick={handleApplyFilter} className="btn btn-primary">
                    Áp dụng
                </button>
            </div>

            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                        type="button"
                    >
                        Tổng Quan
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'brand' ? 'active' : ''}`}
                        onClick={() => setActiveTab('brand')}
                        type="button"
                    >
                        Theo Loại giày
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                        type="button"
                    >
                        Sản Phẩm Đã Bán
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="tab-pane fade show active">
                        <div className={cx('overview-cards')}>
                            <div className={cx('stat-card', 'orders')}>
                                <div className={cx('stat-icon')}>
                                    <i className="fas fa-shopping-cart"></i>
                                </div>
                                <div className={cx('stat-info')}>
                                    <h3>{overview.totalOrders}</h3>
                                    <p>Tổng Đơn Hàng</p>
                                </div>
                            </div>
                            <div className={cx('stat-card', 'revenue')}>
                                <div className={cx('stat-icon')}>
                                    <i className="fas fa-dollar-sign"></i>
                                </div>
                                <div className={cx('stat-info')}>
                                    <h3>{formatPriceVN(overview.totalRevenue)}</h3>
                                    <p>Tổng Doanh Thu</p>
                                </div>
                            </div>
                            <div className={cx('stat-card', 'products')}>
                                <div className={cx('stat-icon')}>
                                    <i className="fas fa-box"></i>
                                </div>
                                <div className={cx('stat-info')}>
                                    <h3>{overview.totalProductsSold}</h3>
                                    <p>Sản Phẩm Đã Bán</p>
                                </div>
                            </div>
                            <div className={cx('stat-card', 'average')}>
                                <div className={cx('stat-icon')}>
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div className={cx('stat-info')}>
                                    <h3>{formatPriceVN(overview.avgOrderValue)}</h3>
                                    <p>Giá Trị TB/Đơn</p>
                                </div>
                            </div>
                        </div>

                        {/* Biểu đồ doanh thu */}
                        <div className={cx('chart-section')}>
                            <ChartLine />
                        </div>
                    </div>
                )}

                {/* Brand Statistics Tab */}
                {activeTab === 'brand' && (
                    <div className="tab-pane fade show active">
                        <div className={cx('brand-stats')}>
                            {brandStats.map((brand) => (
                                <div
                                    key={brand.brandId}
                                    className={cx('brand-card', { selected: selectedBrand === brand.brandId })}
                                    onClick={() => handleBrandClick(brand.brandId)}
                                >
                                    <div className={cx('brand-header')}>
                                        <h4>{brand.brandName}</h4>
                                        <span className={cx('badge')}>{brand.totalOrders} đơn</span>
                                    </div>
                                    <div className={cx('brand-stats-details')}>
                                        <div className={cx('stat-row')}>
                                            <span>Số lượng bán:</span>
                                            <strong>{brand.totalQuantity}</strong>
                                        </div>
                                        <div className={cx('stat-row')}>
                                            <span>Doanh thu:</span>
                                            <strong className={cx('revenue-text')}>{formatPriceVN(brand.totalRevenue)}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Brand Detail */}
                        {selectedBrand && brandDetail && (
                            <div className={cx('brand-detail')}>
                                <h3 className={cx('detail-title')}>
                                    Chi Tiết: {brandDetail.brand?.name}
                                </h3>
                                <div className={cx('detail-summary')}>
                                    <div className={cx('summary-item')}>
                                        <span>Tổng sản phẩm đã bán:</span>
                                        <strong>{brandDetail.totalQuantity}</strong>
                                    </div>
                                    <div className={cx('summary-item')}>
                                        <span>Tổng doanh thu:</span>
                                        <strong>{formatPriceVN(brandDetail.totalRevenue)}</strong>
                                    </div>
                                </div>

                                <div className={cx('products-list')}>
                                    <h4>Danh sách sản phẩm đã bán</h4>
                                    {brandDetail.products && brandDetail.products.length > 0 ? (
                                        <table className="table table-striped table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Tên Sản Phẩm</th>
                                                    <th>Số Lượng Bán</th>
                                                    <th>Doanh Thu</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {brandDetail.products.map((product) => (
                                                    <tr key={product.productId}>
                                                        <td>{product.productName}</td>
                                                        <td>{product.totalQuantity}</td>
                                                        <td className={cx('revenue-text')}>{formatPriceVN(product.totalRevenue)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-muted">Không có sản phẩm nào được bán trong khoảng thời gian này.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sold Products Tab */}
                {activeTab === 'products' && (
                    <div className="tab-pane fade show active">
                        <div className={cx('filter-brand')}>
                            <label>Lọc theo loại giày:</label>
                            <select
                                className="form-select"
                                value={selectedBrand || ''}
                                onChange={(e) => setSelectedBrand(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Tất cả</option>
                                {brandStats.map((brand) => (
                                    <option key={brand.brandId} value={brand.brandId}>
                                        {brand.brandName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {soldProducts.length > 0 ? (
                            <table className="table table-striped table-hover mt-3">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Tên Sản Phẩm</th>
                                        <th>Loại giày</th>
                                        <th>Số Lượng Bán</th>
                                        <th>Doanh Thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {soldProducts.map((product, index) => (
                                        <tr key={product.productId}>
                                            <td>{index + 1}</td>
                                            <td>{product.productName}</td>
                                            <td>
                                                <span className={`badge ${
                                                    product.brandName === 'Giày Nam' ? 'bg-primary' :
                                                    product.brandName === 'Giày Nữ' ? 'bg-danger' :
                                                    'bg-success'
                                                }`}>
                                                    {product.brandName}
                                                </span>
                                            </td>
                                            <td>{product.totalQuantitySold}</td>
                                            <td className={cx('revenue-text')}>{formatPriceVN(product.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={cx('empty-state')}>
                                <i className="fas fa-inbox"></i>
                                <p>Không có sản phẩm nào được bán trong khoảng thời gian này.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageStatistics;
