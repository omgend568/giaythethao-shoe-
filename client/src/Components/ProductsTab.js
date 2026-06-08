import classNames from 'classnames/bind';
import styles from '../Styles/ProductsTab.module.scss';
import CardBody from './CardBody';

import { useState } from 'react';

const cx = classNames.bind(styles);

function ProductsTab({ dataProducts }) {
    const [checkList, setCheckList] = useState('1');

    const handleActiveList = (e) => {
        setCheckList(e);
    };

    return (
        <div className={cx('wrapper')}>
            <header>
                <h1>Sản Phẩm Nổi Bật</h1>
                <div className={cx('list-select')}>
                    <ul style={{ padding: '0' }}>
                        <li onClick={() => handleActiveList('1')} className={checkList === '1' && cx('active-list')}>
                            Giày Nam Giới
                        </li>
                        <li onClick={() => handleActiveList('2')} className={checkList === '2' && cx('active-list')}>
                            Giày Nữ Giới
                        </li>
                        <li onClick={() => handleActiveList('3')} className={checkList === '3' && cx('active-list')}>
                            Giày Trẻ Em
                        </li>
                    </ul>
                </div>
            </header>

            <main className={cx('main')}>
                {dataProducts
                    .filter(
                        (item) =>
                            (item.brandId ? Number(item.brandId) : item.Brand?.id) ===
                            Number(checkList)
                    )
                    .slice(0, 8)
                    .map((item) => (
                        <CardBody key={item.id} item={item} />
                    ))}
            </main>
        </div>
    );
}

export default ProductsTab;
