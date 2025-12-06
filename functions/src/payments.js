const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");
require("dotenv").config();

// 컬렉션에 맞추어서 createPayment
exports.createPayment = functions.https.onCall(async (data, context) => {
    // 로그인한 사용자인지 확인
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const { imp_uid, merchant_uid, amount } = data;

    try {
        // PortOne 토큰 발급 받기
        const getTokenResponse = await axios.post("https://api.iamport.kr/users/getToken", {
            imp_key: process.env.PORTONE_API_KEY,
            imp_secret: process.env.PORTONE_API_SECRET
        });
        const { access_token } = getTokenResponse.data.response;

        // 결제 정보 조회
        const getPaymentData = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
            headers: { Authorization: access_token }
        });
        const paymentData = getPaymentData.data.response;

        // 검증 로직
        if (paymentData.amount === amount && paymentData.status === "paid") {

            // 컬렉션 이름 'payments'로 통일, 필드명 'userId'로 통일
            await admin.firestore().collection("payments").doc(imp_uid).set({
                userId: context.auth.uid,
                imp_uid: imp_uid,
                merchant_uid: merchant_uid,
                amount: paymentData.amount,
                status: "success",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 구매 내역 추가 (권한 부여용)
            await admin.firestore().collection("purchases").add({
                userId: context.auth.uid,
                projectId: merchant_uid.split("_")[1] || "unknown", // merchant_uid format: "pay_{projectId}_{timestamp}" 가정
                paymentId: imp_uid,
                amount: paymentData.amount,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, message: "결제 검증 완료" };
        } else {
            throw new functions.https.HttpsError("invalid-argument", "결제 금액이 일치하지 않습니다.");
        }

    } catch (error) {
        console.error(error);
        throw new functions.https.HttpsError("internal", "결제 검증 실패", error.message);
    }
});