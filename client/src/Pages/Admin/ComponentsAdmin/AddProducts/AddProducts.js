import className from 'classnames/bind';
import styles from './AddProducts.module.scss';
import { useState, useRef, useEffect } from 'react';
import request from '../../../../Config/api';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Editor } from '@tinymce/tinymce-react';

const cx = className.bind(styles);

function AddProducts({ setCheckOpenAddProduct }) {
    const [nameProduct, setNameProduct] = useState('');
    const [description, setDescription] = useState('');
    const [fileImg, setFileImg] = useState([]);
    const [brandList, setBrandList] = useState([]);
    const [brandId, setBrandId] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [variants, setVariants] = useState([
        { color: '', sizesText: '', price: 0, stock: 0 },
    ]);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        const initBrands = async () => {
            try {
                await request.post('/api/seed-brands');
            } catch (error) {
                console.log('Brands already seeded or error:', error);
            }
            try {
                const res = await request.get('/api/brands');
                setBrandList(res.data || []);
            } catch (err) {
                console.error('Failed to fetch brands', err);
            }
        };
        initBrands();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            if (brandId) {
                try {
                    const response = await request.get(`/api/categories?brandId=${brandId}`);
                    setCategories(response.data);
                } catch (error) {
                    console.log('Error fetching categories:', error);
                    setCategories([]);
                }
            } else {
                setCategories([]);
            }
            setSelectedCategory('');
        };
        fetchCategories();
    }, [brandId]);

    const handleFileChange = (e) => {
        const filesArray = Array.from(e.target.files);
        const newImg = filesArray.sort((a, b) => a.name.localeCompare(b.name));

        setFileImg(newImg);
    };

    const editorRef = useRef(null);

    const handleEditorChange = () => {
        if (editorRef.current) {
            setDescription(editorRef.current.getContent());
        }
    };

    const handleAddProduct = async () => {
        if (!nameProduct || !brandId || !selectedCategory || fileImg.length === 0) {
            toast.error('Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 ảnh');
            return;
        }

        const preparedVariants = variants.map((v) => ({
            ...v,
            sizes: v.sizesText
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s !== ''),
        }));

        if (
            !preparedVariants.length ||
            preparedVariants.some((v) => !v.color || !v.sizes.length || !v.price)
        ) {
            toast.error('Mỗi variant phải có màu, ít nhất 1 size và giá');
            return;
        }

        const formData = new FormData();
        formData.append('nameProduct', nameProduct);
        formData.append('description', description);
        formData.append('brandId', Number(brandId));
        formData.append('categoryId', Number(selectedCategory));
        formData.append('variants', JSON.stringify(preparedVariants));
        formData.append('is_new', isNew);

        fileImg.forEach((file) => {
            formData.append('fileImg', file);
        });

        try {
            const response = await request.post('/api/addproduct', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success(response.data.message);
            clearForm();
        } catch (error) {
            console.error('Error uploading product:', error);
            toast.error('Lỗi khi thêm sản phẩm: ' + (error.response?.data?.message || error.message));
        }
    };

    const clearForm = () => {
        setNameProduct('');
        setDescription('');
        setBrandId(0);
        setSelectedCategory('');
        setFileImg([]);
        setVariants([{ color: '', sizesText: '', price: 0, stock: 0 }]);
        setIsNew(false);
    };

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <div className={cx('title')}>
                <h1>Đăng Sản Phẩm</h1>
                <button onClick={() => setCheckOpenAddProduct(false)} type="button" className="btn btn-primary">
                    Quay Lại
                </button>
            </div>
            <div className="form-floating mb-3">
                <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={nameProduct}
                    onChange={(e) => setNameProduct(e.target.value)}
                />
                <label htmlFor="floatingInput">Tên Sản Phẩm</label>
            </div>
            <select
                className="form-select mb-3"
                aria-label="Brand select"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
            >
                <option value="0">Chọn Brand (Loại Giày)</option>
                {brandList.map((b) => (
                    <option key={b.id} value={b.id}>
                        {b.name}
                    </option>
                ))}
            </select>

            <select
                className="form-select"
                aria-label="Category select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!brandId || categories.length === 0}
            >
                <option value="">Chọn Danh Mục</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>

            <div className="form-check mb-3">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id="isNewCheck"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="isNewCheck">
                    Sản phẩm mới
                </label>
            </div>

            <div className="mt-4">
                <label className="mb-2 d-block">Mô tả sản phẩm</label>
                <Editor
                    apiKey="n4hxnmi16uwk9dmdgfx6nscsf8oc30528dlcub1mzsk8deqy"
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    initialValue={description}
                    init={{
                        height: 500,
                        menubar: false,
                        plugins: [
                            'advlist',
                            'autolink',
                            'lists',
                            'link',
                            'image',
                            'charmap',
                            'preview',
                            'anchor',
                            'searchreplace',
                            'visualblocks',
                            'code',
                            'fullscreen',
                            'insertdatetime',
                            'media',
                            'table',
                            'code',
                            'help',
                            'wordcount',
                        ],
                        toolbar:
                            'undo redo | formatselect | ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    }}
                    onChange={handleEditorChange}
                />
            </div>

            <div className={cx('form-upload-image')}>
                <div style={{ height: '25px' }}>
                    <FontAwesomeIcon id={cx('icon-animation')} icon={faAngleDown} />
                </div>
                <label className={cx('upload-label')} htmlFor="file-upload">
                    + Chọn hình ảnh sản phẩm
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    name="fileImg"
                    multiple
                    onChange={handleFileChange}
                />
                <span className={cx('upload-note')}>
                    {fileImg.length > 0
                        ? `Đã chọn ${fileImg.length} hình ảnh`
                        : 'Chưa chọn hình ảnh nào'}
                </span>
                <div className={cx('image-container')}>
                    {fileImg.map((file, index) => (
                        <div key={index} className={cx('image-upload')}>
                            <img src={URL.createObjectURL(file)} alt="" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <h5>Variants</h5>
                {variants.map((v, idx) => (
                    <div key={idx} className="d-flex gap-2 mb-2 align-items-center">
                        <input
                            type="text"
                            placeholder="Màu"
                            className="form-control"
                            value={v.color}
                            onChange={(e) => {
                                const newVars = [...variants];
                                newVars[idx].color = e.target.value;
                                setVariants(newVars);
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Sizes (cách nhau bởi dấu phẩy: 38,39,40)"
                            className="form-control"
                            min="0"
                            value={v.sizesText}
                            onChange={(e) => {
                                const newVars = [...variants];
                                newVars[idx].sizesText = e.target.value;
                                setVariants(newVars);
                            }}
                            onBlur={(e) => {
                                if (e.target.value < 0) {
                                    toast.error('Size không được nhỏ hơn 0');
                                    const newVars = [...variants];
                                    newVars[idx].sizesText = '';
                                    setVariants(newVars);
                                }
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Giá"
                            className="form-control"
                            min="0"
                            value={v.price}
                            onChange={(e) => {
                                const newVars = [...variants];
                                newVars[idx].price = e.target.value;
                                setVariants(newVars);
                            }}
                            onBlur={(e) => {
                                if (e.target.value < 0) {
                                    toast.error('Giá không được nhỏ hơn 0');
                                    const newVars = [...variants];
                                    newVars[idx].price = 0;
                                    setVariants(newVars);
                                }
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Stock"
                            className="form-control"
                            min="0"
                            value={v.stock}
                            onChange={(e) => {
                                const newVars = [...variants];
                                newVars[idx].stock = e.target.value;
                                setVariants(newVars);
                            }}
                            onBlur={(e) => {
                                if (e.target.value < 0) {
                                    toast.error('Stock không được nhỏ hơn 0');
                                    const newVars = [...variants];
                                    newVars[idx].stock = 0;
                                    setVariants(newVars);
                                }
                            }}
                        />
                        {variants.length > 1 && (
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    setVariants(variants.filter((_, i) => i !== idx));
                                }}
                            >
                                Xóa
                            </button>
                        )}
                    </div>
                ))}
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                        setVariants([...variants, { color: '', sizesText: '', price: 0, stock: 0 }])
                    }
                >
                    Thêm variant
                </button>
            </div>
            <div className={cx('btn-submit')}>
                <button onClick={handleAddProduct}>Thêm Sản Phẩm</button>
            </div>
        </div>
    );
}

export default AddProducts;
