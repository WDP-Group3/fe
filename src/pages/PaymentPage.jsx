
import React, { useEffect } from 'react';
import { Card, Typography, Descriptions } from 'antd';
import { useUser } from '../lib/hooks/hooks';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const { Title, Text, Paragraph } = Typography;

const PaymentPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user]);

    const query = new URLSearchParams(window.location.search);
    const orderId = query.get('orderId');

    const BANK_INFO = {
        bankName: 'MBBank',
        accountNumber: 'VQRQAGQXR1752',
        accountName: 'STU MENTAL HEALTH',
        amount: 99000,
        description: `dh ${orderId || 'unknown'}`,
    };

    const qrUrl = `https://qr.sepay.vn/img?acc=${BANK_INFO.accountNumber}&bank=${BANK_INFO.bankName}&amount=${BANK_INFO.amount}&des=${BANK_INFO.description}`;

    useEffect(() => {
        if (!orderId) return;

        const interval = setInterval(async () => {
            try {
                const { data } = await api.get(`/transactions/${orderId}/status`);
                if (data.status === 'completed') {
                    navigate('/');
                }
            } catch (error) {
                console.error('Error checking status', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [orderId, navigate]);

    return (
        <div className="min-h-screen bg-[#f0f2f5] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Card className="rounded-3xl shadow-xl overflow-hidden border-none text-center">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-8 px-4 mb-8">
                        <Title level={2} className="!text-white !mb-0">Thanh toán Premium</Title>
                        <Text className="text-white/80">Quét mã QR để hoàn tất thanh toán</Text>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 justify-center items-start px-6 pb-8">
                        {/* QR Code Section */}
                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
                            <img
                                src={qrUrl}
                                alt="Payment QR Code"
                                className="w-64 h-64 object-contain mx-auto"
                            />
                            <div className="mt-4 text-sm text-gray-500">
                                Sử dụng App ngân hàng để quét mã
                            </div>
                        </div>

                        {/* Payment Details Section */}
                        <div className="flex-1 text-left">
                            <Descriptions column={1} bordered size="middle" labelStyle={{ width: '140px', fontWeight: 'bold' }}>
                                <Descriptions.Item label="Ngân hàng">{BANK_INFO.bankName}</Descriptions.Item>
                                <Descriptions.Item label="Số tài khoản">
                                    <Paragraph copyable={{ text: BANK_INFO.accountNumber }} className="!mb-0">
                                        {BANK_INFO.accountNumber}
                                    </Paragraph>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số tiền">
                                    <Text className="text-xl font-bold text-indigo-600">
                                        {BANK_INFO.amount.toLocaleString('vi-VN')}đ
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Nội dung">
                                    <Paragraph copyable={{ text: BANK_INFO.description }} className="!mb-0 font-mono bg-gray-50 p-1 rounded">
                                        {BANK_INFO.description}
                                    </Paragraph>
                                </Descriptions.Item>
                            </Descriptions>

                            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <Title level={5} className="!text-blue-700 !mb-2">⚠️ Lưu ý quan trọng</Title>
                                <ul className="list-disc list-inside text-gray-600 space-y-1">
                                    <li>Vui lòng nhập chính xác <strong>Nội dung chuyển khoản</strong> để hệ thống tự động kích hoạt.</li>
                                    <li>Hệ thống thường xử lý trong 1-3 phút.</li>
                                    <li>Nếu gặp vấn đề, vui lòng liên hệ hỗ trợ.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PaymentPage;
