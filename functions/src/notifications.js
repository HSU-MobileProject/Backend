const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

//채팅 알림
// 채팅 메시지가 생성되면 알림 발송
exports.sendChatNotification = functions.firestore
    .document("chatRooms/{roomId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const roomId = context.params.roomId;

        // 채팅방 정보 가져오기
        const roomSnap = await admin.firestore().collection("chatRooms").doc(roomId).get();
        const participants = roomSnap.data().participants;

        // 수신자 찾기
        const receiverUid = participants.find(uid => uid !== message.senderUid);
        if (!receiverUid) return null;

        // 수신자의 FCM 토큰 가져오기
        const userSnap = await admin.firestore().collection("users").doc(receiverUid).get();
        const fcmToken = userSnap.data().fcmToken;

        if (!fcmToken) {
            console.log("FCM 토큰이 없습니다.");
            return null;
        }

        // 알림 메시지 구성
        const payload = {
            notification: {
                title: "새로운 메시지",
                body: message.text.length > 20 ? message.text.substring(0, 20) + "..." : message.text,
            },
            data: {
                roomId: roomId,
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            }
        };

        return admin.messaging().sendToDevice(fcmToken, payload);
    });

//결제 알림
// 결제(payments) 문서가 생성되면 -> 알림(notifications) 문서 자동 생성
exports.onPaymentCreate = functions.firestore
    .document("payments/{paymentId}")
    .onCreate(async (snap, context) => {
        const payment = snap.data();

        // 알림 데이터 생성 (DB에 저장)
        [cite_start]// 이 데이터는 프론트엔드에서 "알림 목록"을 조회할 때 사용됩니다[cite: 712, 786].
        await admin.firestore().collection("notifications").add({
            userId: payment.userId || payment.buyerUid, // 문서 필드명에 맞춰 조정 필요
            type: "payment",
            title: "결제 완료",
            body: `${payment.amount}원 결제가 완료되었습니다.`,
            paymentId: context.params.paymentId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });