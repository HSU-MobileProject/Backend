const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

exports.verifyPayment = functions.https.onCall(async (data, context) => {
    // 로그인한 사용자인지 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { imp_uid, merchant_uid, amount } = data;

    try {
        // PortOne 토큰 발급 받기
        const getTokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
            imp_key: process.env.PORTONE_API_KEY,
            imp_secret: process.env.PORTONE_API_SECRET
        });
        const { access_token } = getTokenResponse.data.response;

        // 결제 정보 조회
        const getPaymentData = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
            headers: { Authorization: access_token }
        });
        const paymentData = getPaymentData.data.response;

        // 검증: 실제 결제된 금액과 DB상의 주문 금액이 일치하는지 확인
        // (여기서는 프론트에서 보낸 amount와 비교하지만, 실제로는 DB의 '주문' 문서를 조회해서 비교해야 안전함)
        if (paymentData.amount === amount && paymentData.status === 'paid') {

            // 검증 성공 시 DB에 결제 내역 저장 (transactions 컬렉션)
            await admin.firestore().collection('transactions').doc(imp_uid).set({
                uid: context.auth.uid,
                imp_uid: imp_uid,
                merchant_uid: merchant_uid,
                amount: paymentData.amount,
                status: 'success',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, message: "결제 검증 완료" };
        } else {
            // 금액 불일치 등 위조 의심
            throw new functions.https.HttpsError('invalid-argument', '결제 금액이 일치하지 않습니다.');
        }

    } catch (error) {
        console.error(error);
        throw new functions.https.HttpsError('internal', '결제 검증 실패', error.message);
    }
});