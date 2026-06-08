import classNames from 'classnames/bind';
import styles from '../Styles/Pagination.module.scss';

const cx = classNames.bind(styles);

function Pagination({ page, totalPages, handlePageChange }) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className={cx('wrapper')}>
            <nav>
                <ul className="pagination justify-content-center">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                        <li key={pageNumber} className={`page-item ${page === pageNumber ? 'active' : ''}`}>
                            <button
                                type="button"
                                className="page-link"
                                onClick={() => handlePageChange(null, pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}

export default Pagination;
