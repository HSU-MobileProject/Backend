const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 채팅 메시지가 생성되면 알림 발송
exports.sendChatNotification = functions.firestore
    .document('chatRooms/{roomId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const roomId = context.params.roomId;

        // 채팅방 정보 가져오기 (참여자 확인)
        const roomSnap = await admin.firestore().collection('chatRooms').doc(roomId).get();
        const participants = roomSnap.data().participants;

        // 수신자 찾기 (보낸 사람이 아닌 사람)
        const receiverUid = participants.find(uid => uid !== message.senderUid);
        if (!receiverUid) return null;

        // 수신자의 FCM 토큰 가져오기 (users 컬렉션에 토큰이 저장돼 있다고 가정)
        const userSnap = await admin.firestore().collection('users').doc(receiverUid).get();
        const fcmToken = userSnap.data().fcmToken;

        if (!fcmToken) {
            console.log('FCM 토큰이 없습니다.');
            return null;
        }

        // 알림 메시지 구성
        const payload = {
            notification: {
                title: '새로운 메시지',
                body: message.text.length > 20 ? message.text.substring(0, 20) + '...' : message.text,
            },
            data: {
                roomId: roomId,
                click_action: 'FLUTTER_NOTIFICATION_CLICK' // React Native에서 처리에 따라 변경
            }
        };

        // 전송
        return admin.messaging().sendToDevice(fcmToken, payload);
    });