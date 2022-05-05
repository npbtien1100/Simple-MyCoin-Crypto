Bài tập cá nhân về Blockchain:

Link demo: https://youtu.be/cJx61vP4wSY

Yêu cầu:

1. Ghi nhận quá trình làm việc lên Github (Source Code, Tài liệu tham khảo, Readme.txt)
2. Quay lại video cách sử dụng
   Xây dựng hệ thống tiền điện tử MyCoin :
3. Phần giao diện và quá trình thao tác tương tự https://www.myetherwallet.com/wallet/create
   a. Tạo Ví(Wallet)
   b. Xem thống kê tài khoản
   c. Gởi coin cho một địa chỉ khác
   d. Xem lịch sử giao dịch (https://etherscan.io/)
4. Sử dụng thuật toán Proof Of Work/Proof Of Stake/…

```
Hướng dẫn sử dụng
1. Cài đặt các gói cần thiết bằng lệnh: npm install
2. Chạy server
Mỗi server cần cấu hình HTTP_PORT và P2P_PORT trong file .env
Mỗi server đóng vai trò là một node trong mạng lưới blockchain
example:
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
...
```

```
Tài liệu tham khảo
https://github.com/Savjee/SavjeeCoin
https://github.com/kashishkhullar/blockchain-nodejs
```
