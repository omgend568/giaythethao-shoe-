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

export default getUploadUrl;
