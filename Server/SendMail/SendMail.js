const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;

let oAuth2Client = null;

// Chỉ khởi tạo OAuth2 nếu có đủ credentials
if (CLIENT_ID && CLIENT_SECRET && REDIRECT_URI && REFRESH_TOKEN) {
    oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

const sendMail = async (email) => {
    try {
        // Nếu không có OAuth credentials, bỏ qua gửi email
        if (!oAuth2Client || !EMAIL_USER) {
            console.log(' Google OAuth credentials không được cấu hình. Email không được gửi.');
            return;
        }

        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });
        const info = await transport.sendMail({
            from: `"GLAB " <${EMAIL_USER}>`, // sender address
            to: email, // list of receivers
            subject: 'Thanks', // Subject line
            text: 'Hello world?', // plain text body
            html: `<b>
            Dear ${email}
            Alibarbie sincerely thanks you for choosing to trust and purchase our products.
            We would like to extend our heartfelt thanks to you for choosing to shop with us. This is greatly appreciated by us, and we are delighted to have the opportunity to serve you.
            Your trust and selection of our products/services not only show your support but also inspire us to continuously improve and provide the best experiences for our customers.
            If you have any questions about your order or need further assistance, please contact us at Email. We are always ready to assist you.
            Once again, we sincerely thank you for accompanying us on this journey. We look forward to serving you again in the future.
            Best regards,
            Alibarbie</b>`,
        });
    } catch (error) {
        console.log(' Lỗi gửi email:', error.message);
        // Không throw error - cho phép chương trình tiếp tục ngay cả khi email gặp lỗi
    }
};

module.exports = sendMail;
