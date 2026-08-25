import { useEffect, useState } from 'react';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FeatureGrid from './Components/FeatureGrid';
import Footer from './Components/Footer';
import Header from './Components/Header';
import ProductsTab from './Components/ProductsTab';
import Slider from './Components/Slider';
import request from './Config/api';
import Chatbot from './utils/Chatbot/Chatbot';
import { ScrollProvider } from './context/ScrollContext';

function App() {
    const [dataProducts, setDataProducts] = useState([]);
    const [lengthCart, setLengthCart] = useState(0);

    useEffect(() => {
        request.get('/api/products').then((res) => {
            setDataProducts(res.data);
        });
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <ScrollProvider>
            <div className="App">
                <ToastContainer  />

                <header>
                    <Header setLengthCart={setLengthCart} lengthCart={lengthCart} />
                </header>

                <main>
                    <div>
                        <Chatbot />
                    </div>
                    <div>
                        <Slider />
                    </div>
                    <div>
                        <ProductsTab dataProducts={dataProducts} />
                    </div>

                    <div>
                        <FeatureGrid />
                    </div>
                </main>
                <footer>
                    <Footer />
                </footer>
            </div>
        </ScrollProvider>
    );
}

export default App;
