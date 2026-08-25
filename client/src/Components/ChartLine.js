import classNames from 'classnames/bind';
import styles from '../Styles/ChartLine.module.scss';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

import { useEffect, useState } from 'react';
import request from '../Config/api';

const cx = classNames.bind(styles);
ChartJS.register(ArcElement, Tooltip, Legend);
function ChartLine() {
    const [dataOrder, setDataOrder] = useState([]);
    const [dataPrice, setDataPrice] = useState(0);
    const [dataPrice2, setDataPrice2] = useState(0);
    const [dataPrice3, setDataPrice3] = useState(0);

    useEffect(() => {
        request.get('/api/dataorderuser').then((res) => {
            if (res?.data) {
                setDataOrder(res.data);
            }
        });
    }, []);

    useEffect(() => {
    const items = dataOrder.flatMap((order) => order.OrderItems || []);
    const sums = { 1: 0, 2: 0, 3: 0 };

    items.forEach((it) => {
        // Truy cập đúng cấu trúc: OrderItem -> ProductVariant -> Product
        const product = it.ProductVariant?.Product;
        
        // Kiểm tra xem brandId hoặc typeId nằm ở đâu (thường là ở Product)
        const brand = product?.brandId || product?.typeId || 0;
        
        const price = parseFloat(it.price || 0) * (it.quantity || 0);

        if (brand === 1) sums[1] += price;
        else if (brand === 2) sums[2] += price;
        else if (brand === 3) sums[3] += price;
    });
    setDataPrice(sums[1]);
    setDataPrice2(sums[2]);
    setDataPrice3(sums[3]);
}, [dataOrder]);



    const data = {
        labels: ['Giày Nam', 'Giày Nữ', 'Giày trẻ em'],
        datasets: [
            {
                label: 'Doanh Thu Đã Bán',
                data: [dataPrice, dataPrice2, dataPrice3],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                enabled: true,
            },
        },
    };

    return (
        <div className={cx('chart-container')}>
            <div className={cx('chart')}>
                <Pie data={data} options={options} />
            </div>
        </div>
    );
}

export default ChartLine;
