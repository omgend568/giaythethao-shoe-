import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import request from '../Config/api';

function CategoryDropdown({ brandId, path, label }) {
    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        let mounted = true;
        request
            .get(`/api/categories?brandId=${brandId}`)
            .then((res) => {
                if (mounted) setCategories(res.data || []);
            })
            .catch(() => {
                if (mounted) setCategories([]);
            });
        return () => {
            mounted = false;
        };
    }, [open, brandId]);

    useEffect(() => {
        const handleOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', handleOutside);
        return () => document.removeEventListener('click', handleOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', marginRight: '12px' }}>
            <span
                role="button"
                onClick={() => setOpen((s) => !s)}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontWeight: 900,
                    color: '#000',
                    textDecoration: 'none',
                    display: 'inline-block',
                }}
            >
                {label}
            </span>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        background: '#fff',
                        minWidth: 160,
                        boxShadow: '0 6px 12px rgba(0,0,0,0.175)',
                        zIndex: 1200,
                    }}
                >
                    {categories.length === 0 ? (
                        <div style={{ padding: '8px 12px' }}>Không có danh mục</div>
                    ) : (
                        categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/category/${path}?cat=${cat.id}`}
                                style={{ display: 'block', padding: '8px 12px', color: '#333', textDecoration: 'none' }}
                                onClick={() => setOpen(false)}
                            >
                                {cat.name}
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default CategoryDropdown;
