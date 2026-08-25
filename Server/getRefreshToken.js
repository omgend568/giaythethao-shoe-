const { google } = require('googleapis');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5001/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
});

console.log('\n===========================================');
console.log('  HƯỚNG DẪN LẤY REFRESH TOKEN MỚI');
console.log('===========================================\n');

console.log('1. Truy cập URL bên dưới:');
console.log('\n' + authUrl + '\n');

console.log('2. Đăng nhập với tài khoản Google của bạn');
console.log('3. Nhấn "Cho phép" (Allow) để cấp quyền');
console.log('4. Sau khi chuyển hướng, bạn sẽ thấy URL trên thanh địa chỉ');
console.log('   có dạng: http://localhost:5001/auth/google/callback?code=XXXXX');
console.log('5. Copy giá trị "code" từ URL đó\n');

console.log('6. Paste giá trị code vào script getRefreshToken.js');
console.log('   và chạy: node getRefreshToken.js\n');

console.log('===========================================\n');

// Nếu có code trong args, xử lý ngay
const args = process.argv.slice(2);
if (args.length > 0) {
    const code = args[0];
    console.log('Đang xử lý code:', code.substring(0, 20) + '...\n');

    oauth2Client.getToken(code)
        .then(({ tokens }) => {
            console.log('===========================================');
            console.log('  LẤY REFRESH TOKEN THÀNH CÔNG!');
            console.log('===========================================\n');
            console.log('REFRESH_TOKEN mới của bạn:');
            console.log(tokens.refresh_token);
            console.log('\n===========================================');
            console.log('Hãy copy và cập nhật vào file .env');
            console.log('===========================================\n');
        })
        .catch(err => {
            console.log('Lỗi khi lấy token:', err.message);
            console.log('\nCó thể code đã hết hạn. Xin chạy lại script này để lấy URL mới.');
        });
}
