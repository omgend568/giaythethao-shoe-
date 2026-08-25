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
            from: `"NIKE SHOP " <${EMAIL_USER}>`,
            to: email,
            subject: ' Đặt hàng thành công - Chờ nhận hàng nhé!',
            text: 'Cảm ơn bạn đã đặt hàng tại NIKE SHOP!',
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2E86C1;"> Xin chúc mừng, ${email}!</h2>
                <p>Đơn hàng của bạn đã được xác nhận thành công tại <b>NIKE SHOP</b>! </p>
                <p>Chúng tôi rất vui mừng khi có cơ hội phục vụ bạn và cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất.</p>
                
                <h3 style="color: #28B463;"> Trạng thái đơn hàng:</h3>
                <p> Đã tiếp nhận đơn hàng</p>
                <p> Đang chuẩn bị hàng</p>
                <p> Sắp giao đến bạn</p>

                <p><b>Thời gian dự kiến giao hàng:</b> <i>Trong vòng 2-5 ngày làm việc</i> (tùy vào địa điểm).</p>

                <h3 style="color: #D68910;"> Lưu ý quan trọng:</h3>
                <p>- Kiểm tra kỹ thông tin đơn hàng trong email xác nhận.</p>
                <p>- Nếu có sai sót hoặc muốn thay đổi, hãy liên hệ ngay với chúng tôi.</p>
                <p>- Khi nhận hàng, nhớ kiểm tra trước khi thanh toán để đảm bảo sản phẩm nguyên vẹn.</p>

                <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại <b><a href="mailto:${EMAIL_USER}" style="color: #2980B9;">liên hệ với chúng tôi</a></b>. Đội ngũ NIKE SHOP luôn sẵn sàng hỗ trợ bạn!</p>

                <p>Cảm ơn bạn đã tin tưởng và ủng hộ <b>NIKE SHOP</b>. Hẹn gặp lại bạn trong những lần mua sắm tiếp theo! 💖</p>

                <p style="color: #2E86C1; font-weight: bold;">Trân trọng,<br> Đội ngũ NIKE SHOP</p>
            </div>
            `,
        });

               return info;
    } catch (error) {
        console.log(' Lỗi gửi email:', error.message);
        // Không throw error - cho phép thanh toán tiếp tục ngay cả khi email gặp lỗi
        return null;
    }
};

module.exports = sendMail;
