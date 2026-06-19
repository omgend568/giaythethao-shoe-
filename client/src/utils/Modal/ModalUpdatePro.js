import { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Editor } from '@tinymce/tinymce-react';
import request from '../../Config/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getUploadUrl = (filename) => {
    if (!filename) return '';

    const defaultServer = 'http://localhost:5001';
    const server = (process.env.REACT_APP_SERVER || defaultServer).replace(/\/$/, '');

    const imgBase = process.env.REACT_APP_IMG;
    if (imgBase) {
        const base = imgBase.replace(/\/$/, '');
        if (base.endsWith('/uploads')) return `${base}/${filename}`;
        if (base.includes('/uploads/')) return `${base}/${filename}`;
        return `${base}/uploads/${filename}`;
    }

    return `${server}/uploads/${filename}`;
};

function ModalUpdatePro({ show, setShow, data }) {
    const [nameProduct, setNameProduct] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [brandList, setBrandList] = useState([]);
    const [brandId, setBrandId] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [variants, setVariants] = useState([]);
    const handleClose = () => setShow(false);
    const editorRef = useRef(null);

    // fetch brands once
    useEffect(() => {
        const loadBrands = async () => {
            try {
                const res = await request.get('/api/brands');
                setBrandList(res.data || []);
            } catch (err) {
                console.error('fail brands', err);
            }
        };
        loadBrands();
    }, []);

    // fetch categories when brandId changes
    useEffect(() => {
        const fetchCategories = async () => {
            if (brandId) {
                try {
                    const resp = await request.get(`/api/categories?brandId=${brandId}`);
                    setCategories(resp.data);
                } catch (e) {
                    console.error('fetch cat error', e);
                    setCategories([]);
                }
            } else {
                setCategories([]);
            }
            setSelectedCategory('');
        };
        fetchCategories();
    }, [brandId]);

    useEffect(() => {
        setNameProduct(data.name);
        setDescription(data.description);
        setBrandId(data.brandId || data.Brand?.id || 0);
        setSelectedCategory('');

        // initialize variants from existing product
        if (data.ProductVariants && Array.isArray(data.ProductVariants)) {
            // group variants by color so sizes can appear together
            const grouped = {};
            data.ProductVariants.forEach((v) => {
                const color = v.color || '';
                const size = v.size ? String(v.size) : '';
                if (!grouped[color]) {
                    grouped[color] = {
                        color,
                        sizesText: size,
                        price: v.price || 0,
                        stock: v.stock || 0,
                    };
                } else if (size) {
                    grouped[color].sizesText += grouped[color].sizesText ? ',' + size : size;
                }
            });
            setVariants(Object.values(grouped));
        } else {
            setVariants([{ color: '', sizesText: '', price: 0, stock: 0 }]);
        }

        // initialize previews from existing product images
        if (data.ProductImages) {
            setPreviewUrls(
                data.ProductImages.map((img) => getUploadUrl(img.url))
            );
        } else {
            setPreviewUrls([]);
        }
        setSelectedFiles([]);
    }, [data]);

    const handleUpdatePro = async () => {
        if (editorRef.current) {
            setDescription(editorRef.current.getContent());
        }

        // basic validation
        if (
            !variants.length ||
            variants.some((v) => !v.color || !v.sizesText || !v.price)
        ) {
            toast.error('Mỗi variant phải có màu, ít nhất 1 size và giá');
            return;
        }

        const formData = new FormData();
        formData.append('id', data.id || data._id);
        formData.append('nameProduct', nameProduct);
        formData.append('description', editorRef.current ? editorRef.current.getContent() : '');
        formData.append('brandId', Number(brandId));
        formData.append('categoryId', Number(selectedCategory));
        // transform sizesText to sizes array
        const preparedVariants = variants.map((v) => ({
            ...v,
            sizes: v.sizesText
                ? v.sizesText
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s !== '')
                : [],
        }));
        formData.append('variants', JSON.stringify(preparedVariants));

        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file) => {
                formData.append('fileImg', file);
            });
        }

        const res = await request.post('/api/editpro', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(res.data.message);
        setShow(false);
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <ToastContainer />
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh Sửa Sản Phẩm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="floatingInput"
                            onChange={(e) => setNameProduct(e.target.value)}
                            value={nameProduct}
                        />
                        <label htmlFor="floatingInput">Tên Sản Phẩm</label>
                    </div>
                    <select
                        className="form-select mb-3"
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                    >
                        <option value={0}>Chọn Brand</option>
                        {brandList.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="form-select mb-3"
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
                    {/* variants editor */}
                    <div className="mb-4">
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
                                    type="text"
                                    placeholder="Sizes (cách nhau bởi dấu phẩy)"
                                    className="form-control"
                                    value={v.sizesText}
                                    onChange={(e) => {
                                        const newVars = [...variants];
                                        newVars[idx].sizesText = e.target.value;
                                        setVariants(newVars);
                                    }}
                                />
                                <input
                                    type="number"
                                    placeholder="Giá"
                                    className="form-control"
                                    value={v.price}
                                    onChange={(e) => {
                                        const newVars = [...variants];
                                        newVars[idx].price = e.target.value;
                                        setVariants(newVars);
                                    }}
                                />
                                <input
                                    type="number"
                                    placeholder="Stock"
                                    className="form-control"
                                    value={v.stock}
                                    onChange={(e) => {
                                        const newVars = [...variants];
                                        newVars[idx].stock = e.target.value;
                                        setVariants(newVars);
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
                            onClick={() => setVariants([...variants, { color: '', sizesText: '', price: 0, stock: 0 }])}
                        >
                            Thêm variant
                        </button>
                    </div>

                    <div className="form-floating mb-3">
                        <label>Hình Ảnh</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="form-control mb-2"
                            onChange={(e) => {
                                const files = Array.from(e.target.files);
                                setSelectedFiles(files);
                                // generate previews
                                const urls = files.map((f) => URL.createObjectURL(f));
                                setPreviewUrls(urls);
                            }}
                        />
                        {previewUrls.length > 0 && (
                            <div className="d-flex flex-wrap">
                                {previewUrls.map((url, idx) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt="preview"
                                        style={{ width: '80px', marginRight: '5px' }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="form-floating mb-3">
                        <Editor
                            apiKey="n4hxnmi16uwk9dmdgfx6nscsf8oc30528dlcub1mzsk8deqy"
                            onInit={(_evt, editor) => (editorRef.current = editor)}
                            value={description}
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
                                    'undo redo | blocks | bold italic forecolor | alignleft aligncenter ' +
                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                    'removeformat | help',
                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                            }}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleUpdatePro}>
                        Lưu Lại
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalUpdatePro;
