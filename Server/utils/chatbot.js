const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const modelProduct = require('../models/ModelProducts');

async function askQuestion(question) {
    try {
        const products = await modelProduct.find({});

        const productHTML = products
            .map(
                (product) => `
            <div style="border: 1px solid #ddd; padding: 12px; margin: 8px 0; border-radius: 6px; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 12px; background: #f9f9f9;">
                ${
                    product.img
                        ? `<img src="${product.img}" alt="${product.name}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px;">`
                        : ''
                }
                <div>
                    <h3 style="font-size: 14px; margin: 4px 0; font-weight: bold; color: #333;">${product.name}</h3>
                    <p style="margin: 4px 0; color: #555; font-size: 13px;"><strong>Giá:</strong> ${
                        product.price
                    } VND</p>
                    ${
                        product._id + product.slug
                            ? `<a href="${product._id}/${product.slug}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 13px;">Xem sản phẩm</a>`
                            : ''
                    }
                </div>
            </div>
        `,
            )
            .join('');

        const prompt = `
        Bạn là một trợ lý bán hàng chuyên nghiệp. 
        Đây là danh sách sản phẩm hiện có trong cửa hàng (hiển thị theo dạng HTML):
        ${productHTML}

        Câu hỏi của khách hàng: "${question}"
        nếu câu hỏi không liên quan đến sản phẩm, hãy trả lời một cách tự nhiên và thân thiện.
        Hãy trả lời một cách tự nhiên và thân thiện, đồng thời hiển thị kết quả dưới dạng HTML để dễ đọc hơn.
        link sản phẩm thường sẽ là http://localhost:3000/product/ + id + slug của sản phẩm
        link hình ảnh sẽ là http://localhost:5001/uploads/ + product.img[0]
        `;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        return answer.replace(/```(html|plaintext)?\n?/g, '').trim();
    } catch (error) {
        console.error('Lỗi khi xử lý câu hỏi: ', error);
        return "<p style='color: red;'>Xin lỗi, hiện tại tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau!</p>";
    }
}

module.exports = { askQuestion };
