import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

import ManagerProduct from '../../../Components/ManageProducts';
import ManageCategories from '../../../Components/ManageCategories';
import ManageOrder from '../../../Components/ManageOrder';
import ManageComments from '../../../Components/ManageComments';
import ManagePromotions from '../../../Components/ManagePromotions';
import ManagerUser from '../../../Components/ManagerUser';
import ManageStatistics from '../../../Components/ManageStatistics';
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

            {checkTypeSlideBar === 3 ? <ManageOrder /> : null}

            {checkTypeSlideBar === 4 ? <ManageComments /> : null}

            {checkTypeSlideBar === 5 ? <ManagePromotions /> : null}

            {checkTypeSlideBar === 6 ? <ManagerUser /> : null}

            {checkTypeSlideBar === 7 ? <ManageStatistics /> : null}
        </div>
    );
}

export default HomePage;
