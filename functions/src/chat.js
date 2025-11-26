const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 채팅 메시지가 생성될 때마다 -> 채팅방의 '마지막 메시지'와 '시간' 업데이트
exports.updateChatRoomLastMessage = functions.firestore
    .document("chatRooms/{roomId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
        const newMessage = snap.data();
        const roomId = context.params.roomId;

        // 상위 채팅방 문서 업데이트
        await admin.firestore().collection("chatRooms").doc(roomId).update({
            lastMessage: newMessage.text,         // 목록에 보여줄 메시지
            lastMessageSenderId: newMessage.senderUid, // 누가 보냈는지 (읽음 처리용)
            updatedAt: newMessage.createdAt       // 정렬을 위한 시간
        });
    });