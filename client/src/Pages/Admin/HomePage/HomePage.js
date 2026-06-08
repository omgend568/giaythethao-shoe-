import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';
import ManageCategories from '../../../Components/ManageCategories';
import { useState } from 'react';

const cx = classNames.bind(styles);

function HomePage({ checkTypeSlideBar }) {
    const [checkOpenAddCategory, setCheckOpenAddCategory] = useState(false);

    return (
        <div className={cx('wrapper')}>
            {checkTypeSlideBar === 1 ? (
                <ManageCategories
                    checkOpenAddCategory={checkOpenAddCategory}
                    setCheckOpenAddCategory={setCheckOpenAddCategory}
                />
            ) : null}
        </div>
    );
}

export default HomePage;
