const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
require("dotenv").config();

exports.verifyPayment = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "로그인이 필요한 서비스입니다."
        );
    }

    const { imp_uid, merchant_uid, amount, projectId } = data;

    if (!imp_uid || !merchant_uid || !projectId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "결제 정보가 부족합니다."
        );
    }

    try {
        // 2. Get Access Token from PortOne
        const getToken = await axios({
            url: "https://api.iamport.kr/users/getToken",
            method: "post",
            headers: { "Content-Type": "application/json" },
            data: {
                imp_key: process.env.PORTONE_API_KEY,
                imp_secret: process.env.PORTONE_API_SECRET,
            },
        });

        const { access_token } = getToken.data.response;
        if (!access_token) {
            throw new functions.https.HttpsError('internal', '포트원 토큰 발급 실패');
        }

        // 3. Get Payment Data from PortOne
        const getPaymentData = await axios({
            url: `https://api.iamport.kr/payments/${imp_uid}`,
            method: "get",
            headers: { "Authorization": access_token },
        });

        const paymentData = getPaymentData.data.response;
        if (!paymentData) {
            throw new functions.https.HttpsError('not-found', '결제 정보를 찾을 수 없습니다.');
        }

        // 4. Verify Amount
        // Note: Use Math.round or similar if float issues arise, but usually KRW is integer.
        // paymentData.amount check
        if (paymentData.amount !== amount) {
            throw new functions.https.HttpsError('aborted', '결제 금액 위조가 의심됩니다.');
        }

        // Status check
        if (paymentData.status !== 'paid') {
            throw new functions.https.HttpsError('aborted', '결제가 완료되지 않았습니다.');
        }

        // 5. Update Firestore
        const db = admin.firestore();
        const batch = db.batch();

        // A. Create Payment Record (or update if relying on webhook -> but verify is sync)
        // Using merchant_uid as doc ID can prevent dupes
        const paymentRef = db.collection('payments').doc(merchant_uid);
        batch.set(paymentRef, {
            imp_uid,
            merchant_uid,
            projectId,
            payerId: context.auth.uid,
            amount: paymentData.amount,
            status: 'paid',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            method: paymentData.pay_method,
            pgProvider: paymentData.pg_provider,
            title: paymentData.name
        });

        // B. (Optional) Provide project access logic here?
        // Not specified, but logical next step. For now, just recording payment is verified.

        await batch.commit();

        return { success: true, message: "결제가 검증 완료되었습니다." };

    } catch (error) {
        console.error("Payment Verification Error:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "결제 검증 중 오류가 발생했습니다.");
    }
});
