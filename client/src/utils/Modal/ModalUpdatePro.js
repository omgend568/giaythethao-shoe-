import { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Editor } from '@tinymce/tinymce-react';
import request from '../../Config/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getUploadUrl = (filename) => {
    if (!filename) return '';
    const server = process.env.REACT_APP_SERVER || 'http://localhost:5001';
    return `${server}/uploads/${filename}`;
};

function ModalUpdatePro({ show, setShow, data }) {
    const [nameProduct, setNameProduct] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [oldImageUrls, setOldImageUrls] = useState([]);
    const [deletedOldImageIds, setDeletedOldImageIds] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [brandList, setBrandList] = useState([]);
    const [brandId, setBrandId] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [variants, setVariants] = useState([]);
    const [isNew, setIsNew] = useState(false);
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
        setIsNew(data.is_new === true || data.is_new === 1);

        // initialize variants from existing product
        // Keep each size separate with its own stock
        if (data.ProductVariants && Array.isArray(data.ProductVariants)) {
            const grouped = {};
            data.ProductVariants.forEach((v) => {
                const color = v.color || '';
                const size = v.size ? String(v.size) : '';
                if (!grouped[color]) {
                    grouped[color] = {
                        color,
                        price: v.price || 0,
                        sizes: [{ size, stock: v.stock || 0 }],
                    };
                } else {
                    grouped[color].sizes.push({ size, stock: v.stock || 0 });
                }
            });
            setVariants(Object.values(grouped));
        } else {
            setVariants([{ color: '', price: 0, sizes: [{ size: '', stock: 0 }] }]);
        }

        // initialize previews from existing product images
        if (data.ProductImages) {
            const existingUrls = data.ProductImages.map((img) => getUploadUrl(img.url));
            setPreviewUrls(existingUrls);
            setOldImageUrls(existingUrls);
        } else {
            setPreviewUrls([]);
            setOldImageUrls([]);
        }
        setSelectedFiles([]);
        setDeletedOldImageIds([]);
        setNewImagePreviews([]);
    }, [data]);

    const handleUpdatePro = async () => {
        if (editorRef.current) {
            setDescription(editorRef.current.getContent());
        }

        // basic validation
        if (
            !variants.length ||
            variants.some((v) => !v.color || !v.price)
        ) {
            toast.error('Mỗi variant phải có màu và giá');
            return;
        }

        // Check if all sizes have size value
        const hasInvalidSize = variants.some((v) =>
            v.sizes.some((s) => !s.size)
        );
        if (hasInvalidSize) {
            toast.error('Mỗi size phải có giá trị');
            return;
        }

        const formData = new FormData();
        formData.append('id', data.id || data._id);
        formData.append('nameProduct', nameProduct);
        formData.append('description', editorRef.current ? editorRef.current.getContent() : '');
        formData.append('brandId', Number(brandId));
        formData.append('categoryId', Number(selectedCategory));
        // Transform variants to array of { color, size, price, stock }
        const preparedVariants = [];
        variants.forEach((v) => {
            v.sizes.forEach((s) => {
                if (s.size) {
                    preparedVariants.push({
                        color: v.color,
                        size: s.size,
                        price: v.price,
                        stock: Number(s.stock) || 0,
                    });
                }
            });
        });
        formData.append('variants', JSON.stringify(preparedVariants));
        formData.append('is_new', isNew);

        // Send IDs of old images to keep (images not deleted by user)
        const imagesToKeep = data.ProductImages
            ? data.ProductImages.map((img) => img.id).filter((id) => !deletedOldImageIds.includes(id))
            : [];
        formData.append('imagesToKeep', JSON.stringify(imagesToKeep));
        formData.append('deletedImageIds', JSON.stringify(deletedOldImageIds));

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
                    <div className="form-check mb-3">
                       
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="isNewCheck"
                            checked={isNew}
                            onChange={(e) => setIsNew(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="isNewCheck">
                            sản phẩm mới
                        </label>
                    </div>
                    
                   
                    <div className="mb-4">
                        <h5>Biến Thể Sản Phẩm</h5>
                        {variants.map((v, colorIdx) => (
                            <div key={colorIdx} className="border rounded p-3 mb-3">
                                <div className="d-flex gap-2 mb-3 align-items-end">
                                    <div className="flex-grow-1">
                                        <label className="form-label">Màu</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={v.color}
                                            onChange={(e) => {
                                                const newVars = [...variants];
                                                newVars[colorIdx].color = e.target.value;
                                                setVariants(newVars);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <label className="form-label">Giá</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            value={v.price}
                                            onChange={(e) => {
                                                const newVars = [...variants];
                                                newVars[colorIdx].price = e.target.value;
                                                setVariants(newVars);
                                            }}
                                            onBlur={(e) => {
                                                if (e.target.value < 0) {
                                                    toast.error('Giá không được nhỏ hơn 0');
                                                    const newVars = [...variants];
                                                    newVars[colorIdx].price = 0;
                                                    setVariants(newVars);
                                                }
                                            }}
                                        />
                                    </div>
                                    {variants.length > 1 && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setVariants(variants.filter((_, i) => i !== colorIdx));
                                            }}
                                        >
                                            Xóa màu
                                        </button>
                                    )}
                                </div>

                                {/* Sizes */}
                                <div className="ms-3">
                                    <label className="form-label fw-bold">Sizes:</label>
                                    {v.sizes && v.sizes.map((s, sizeIdx) => (
                                        <div key={sizeIdx} className="d-flex gap-2 mb-2 align-items-center">
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ maxWidth: '100px' }}
                                                placeholder="Size"
                                                min="0"
                                                value={s.size}
                                                onChange={(e) => {
                                                    const newVars = [...variants];
                                                    newVars[colorIdx].sizes[sizeIdx].size = e.target.value;
                                                    setVariants(newVars);
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value < 0) {
                                                        toast.error('Size không được nhỏ hơn 0');
                                                        const newVars = [...variants];
                                                        newVars[colorIdx].sizes[sizeIdx].size = 0;
                                                        setVariants(newVars);
                                                    }
                                                }}
                                            />
                                            <label className="ms-2">Stock:</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ maxWidth: '120px' }}
                                                min="0"
                                                value={s.stock}
                                                onChange={(e) => {
                                                    const newVars = [...variants];
                                                    newVars[colorIdx].sizes[sizeIdx].stock = e.target.value;
                                                    setVariants(newVars);
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value < 0) {
                                                        toast.error('Stock không được nhỏ hơn 0');
                                                        const newVars = [...variants];
                                                        newVars[colorIdx].sizes[sizeIdx].stock = 0;
                                                        setVariants(newVars);
                                                    }
                                                }}
                                            />
                                            {v.sizes.length > 1 && (
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => {
                                                        const newVars = [...variants];
                                                        newVars[colorIdx].sizes = newVars[colorIdx].sizes.filter((_, i) => i !== sizeIdx);
                                                        setVariants(newVars);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        className="btn btn-outline-secondary btn-sm mt-2"
                                        onClick={() => {
                                            const newVars = [...variants];
                                            newVars[colorIdx].sizes.push({ size: '', stock: 0 });
                                            setVariants(newVars);
                                        }}
                                    >
                                        + Thêm Size
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setVariants([...variants, { color: '', price: 0, sizes: [{ size: '', stock: 0 }] }])}
                        >
                            + Thêm Màu Mới
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
                                // Remove duplicates by comparing name and size
                                const uniqueFiles = files.filter((file, index, self) =>
                                    index === self.findIndex((f) =>
                                        f.name === file.name && f.size === file.size
                                    )
                                );
                                setSelectedFiles(uniqueFiles);
                                // generate previews for new files only
                                const urls = uniqueFiles.map((f) => URL.createObjectURL(f));
                                setNewImagePreviews(urls);
                            }}
                        />
                        {/* Old images with delete option */}
                        {oldImageUrls.length > 0 && (
                            <div className="mb-2">
                                <span className="fw-bold">Ảnh cũ ({oldImageUrls.length}):</span>
                                <div className="d-flex flex-wrap mt-1">
                                    {data.ProductImages.map((img, idx) => {
                                        const isDeleted = deletedOldImageIds.includes(img.id);
                                        if (isDeleted) return null;
                                        return (
                                            <div key={`old-${idx}`} style={{ position: 'relative', display: 'inline-block', marginRight: '5px', marginBottom: '5px' }}>
                                                <img
                                                    src={getUploadUrl(img.url)}
                                                    alt="old"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', opacity: 0.6 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeletedOldImageIds([...deletedOldImageIds, img.id]);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-5px',
                                                        right: '-5px',
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* New images preview */}
                        {newImagePreviews.length > 0 && (
                            <div className="mb-2">
                                <span className="fw-bold">Ảnh mới ({newImagePreviews.length}):</span>
                                <div className="d-flex flex-wrap mt-1">
                                    {newImagePreviews.map((url, idx) => (
                                        <div key={`new-${idx}`} style={{ position: 'relative', display: 'inline-block', marginRight: '5px', marginBottom: '5px' }}>
                                            <img
                                                src={url}
                                                alt="new"
                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #198754' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFiles = selectedFiles.filter((_, i) => i !== idx);
                                                    setSelectedFiles(newFiles);
                                                    const newUrls = newImagePreviews.filter((_, i) => i !== idx);
                                                    setNewImagePreviews(newUrls);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-5px',
                                                    right: '-5px',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {previewUrls.length === 0 && oldImageUrls.length === 0 && (
                            <span className="text-muted">Chưa chọn ảnh nào</span>
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
