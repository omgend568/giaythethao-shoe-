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

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', display: 'inline-block', marginRight: '12px' }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <Link
                to={`/category/${path}`}
                style={{
                    fontWeight: 900,
                    color: '#000',
                    textDecoration: 'none',
                    display: 'inline-block',
                }}
            >
                {label}
            </Link>

            {open && categories.length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        background: '#fff',
                        minWidth: 180,
                        boxShadow: '0 6px 12px rgba(0,0,0,0.175)',
                        zIndex: 1200,
                    }}
                >
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/category/${path}?cat=${cat.id}`}
                            style={{ display: 'block', padding: '8px 12px', color: '#333', textDecoration: 'none' }}
                            onClick={() => setOpen(false)}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CategoryDropdown;
