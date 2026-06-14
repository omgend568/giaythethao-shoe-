import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

import ManagerProduct from '../../../Components/ManageProducts';
import ManageCategories from '../../../Components/ManageCategories';
import AddProducts from '../ComponentsAdmin/AddProducts/AddProducts';
import { useState } from 'react';

const cx = classNames.bind(styles);

function HomePage({ checkTypeSlideBar }) {
    const [checkOpenAddProduct, setCheckOpenAddProduct] = useState(false);
    const [checkOpenAddCategory, setCheckOpenAddCategory] = useState(false);

    return (
        <div className={cx('wrapper')}>
            {checkTypeSlideBar === 1 ? (
                checkOpenAddProduct ? (
                    <AddProducts setCheckOpenAddProduct={setCheckOpenAddProduct} />
                ) : (
                    <ManagerProduct setCheckOpenAddProduct={setCheckOpenAddProduct} />
                )
            ) : null}

            {checkTypeSlideBar === 2 ? (
                <ManageCategories
                    checkOpenAddCategory={checkOpenAddCategory}
                    setCheckOpenAddCategory={setCheckOpenAddCategory}
                />
            ) : null}
        </div>
    );
}

export default HomePage;
