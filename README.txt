Ứng dụng chạy trên nền tảng nodejs.

Bước 1: 
Cài đặt các gói cần thiết bằng lệnh: npm install

Bước 2:
Cấu hình HTTP_PORT và P2P_PORT trong file .env
Example:
node1:
HTTP_PORT=3000
P2P_PORT=5000
node2:
HTTP_PORT=3001
P2P_PORT=5001
PEERS =ws://localhost:5000
node3:
P2P_PORT= 5002
HTTP_PORT = 3002
PEERS =ws://localhost:5000,ws://localhost:5001

Bước 3: 
Khởi chạy server: npm start