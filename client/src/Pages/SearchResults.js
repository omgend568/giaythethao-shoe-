import classNames from 'classnames/bind';
import styles from '../Styles/SearchResults.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import CardBody from '../Components/CardBody';
import request from '../Config/api';
import useDebounce from '../hooks/useDebounce';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const cx = classNames.bind(styles);

function SearchResults() {
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('q') || '';
    const debouncedKeyword = useDebounce(keyword, 500);
    const [dataProducts, setDataProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [debouncedKeyword]);

    useEffect(() => {
        if (!debouncedKeyword.trim()) {
            setDataProducts([]);
            return;
        }

        setLoading(true);
        request
            .get('/api/search', { params: { nameProduct: debouncedKeyword } })
            .then((res) => setDataProducts(Array.isArray(res.data) ? res.data : []))
            .catch(() => setDataProducts([]))
            .finally(() => setLoading(false));
    }, [debouncedKeyword]);

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <h2>Kết quả tìm kiếm</h2>
                {keyword ? (
                    <p className={cx('keyword')}>
                        Từ khóa: <strong>{keyword}</strong>
                    </p>
                ) : (
                    <p className={cx('keyword')}>Vui lòng nhập từ khóa tìm kiếm trên thanh menu.</p>
                )}

                {loading && <p>Đang tìm kiếm...</p>}

                {!loading && keyword && dataProducts.length === 0 && (
                    <p className={cx('empty')}>Không tìm thấy sản phẩm phù hợp.</p>
                )}

                <div className={cx('card')}>
                    {dataProducts.map((item) => (
                        <CardBody key={item.id} item={item} />
                    ))}
                </div>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default SearchResults;
