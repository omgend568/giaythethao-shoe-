import classNames from 'classnames/bind';
import styles from '../Styles/Category.module.scss';

import Header from '../Components/Header';
import Footer from '../Components/Footer';
import CardBody from '../Components/CardBody';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import request from '../Config/api';
import Pagination from '../Components/Pagination';

const cx = classNames.bind(styles);

const getProductPrice = (item) => item?.ProductVariants?.[0]?.price || item?.price || 0;

const BRAND_LABELS = {
    'giay-nam': 'Giày Nam',
    'giay-nu': 'Giày Nữ',
    'giay-tre-em': 'Giày Trẻ Em',
};

function Category() {
    const [dataProducts, setDataProducts] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [checkList, setCheckList] = useState(1);
    const [sortOrder, setSortOrder] = useState('1');
    const [page, setPage] = useState(1);

    const location = useLocation();
    const pathName = location.pathname.slice(10);
    const searchParams = new URLSearchParams(location.search);
    const categoryId = searchParams.get('cat');

    useEffect(() => {
        if (pathName === 'giay-nam') {
            setCheckList(1);
        } else if (pathName === 'giay-nu') {
            setCheckList(2);
        } else if (pathName === '') {
            setCheckList('');
        } else {
            setCheckList(3);
        }
        setPage(1);
    }, [pathName, categoryId]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (categoryId) {
                const res = await request.get('/api/products-by-category', {
                    params: { categoryId },
                });
                const products = Array.isArray(res.data) ? res.data : [];
                setDataProducts(products);

                const nameFromProduct = products[0]?.Categories?.[0]?.name;
                if (nameFromProduct) {
                    setCategoryName(nameFromProduct);
                } else {
                    const catRes = await request.get('/api/all-categories');
                    const cat = (catRes.data || []).find((c) => String(c.id) === String(categoryId));
                    setCategoryName(cat?.name || '');
                }
            } else {
                const res = await request.get('/api/products');
                setDataProducts(res.data);
                setCategoryName('');
            }
        };

        fetchProducts();
    }, [categoryId]);

    const filteredProducts = categoryId
        ? dataProducts
        : dataProducts.filter(
              (item) =>
                  checkList === '' ||
                  (item.brandId ? Number(item.brandId) : item.Brand?.id) === Number(checkList)
          );

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        return sortOrder === '1'
            ? getProductPrice(a) - getProductPrice(b)
            : getProductPrice(b) - getProductPrice(a);
    });

    const productsPerPage = 12;
    const startIndex = (page - 1) * productsPerPage;
    const currentProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const pageTitle = categoryId
        ? categoryName
        : BRAND_LABELS[pathName] || (pathName === '' ? 'Tất Cả Sản Phẩm' : '');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathName, page, categoryId]);

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                {pageTitle && (
                    <h2 style={{ marginBottom: '16px', fontSize: '22px' }}>
                        {categoryId ? `Danh mục: ${pageTitle}` : pageTitle}
                    </h2>
                )}
                <div className={cx('filter-product')}>
                    {!(pathName === 'giay-nam' || pathName === 'giay-nu' || pathName === 'giay-tre-em') && (
                        <div>
                            <select
                                onChange={(e) => {
                                    setCheckList(e.target.value);
                                    setPage(1);
                                }}
                                className="form-select"
                                aria-label="Chọn loại giày"
                                value={checkList}
                            >
                                <option value="">Chọn Loại Giày</option>
                                <option value={1}>Giày Nam</option>
                                <option value={2}>Giày Nữ</option>
                                <option value={3}>Giày Trẻ Em</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <select
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="form-select"
                            aria-label="Lọc theo giá"
                            value={sortOrder}
                        >
                            <option value="1">Từ Thấp Đến Cao</option>
                            <option value="2">Từ Cao Đến Thấp</option>
                        </select>
                    </div>
                </div>

                <div className={cx('card')}>
                    {currentProducts.length > 0 ? (
                        currentProducts.map((item) => <CardBody key={item.id} item={item} />)
                    ) : (
                        <p>Không có sản phẩm nào.</p>
                    )}
                </div>

                <div className={cx('pagination')}>
                    <Pagination totalPages={totalPages} page={page} handlePageChange={handlePageChange} />
                </div>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default Category;
