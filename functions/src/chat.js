const functions = require("firebase-functions/v1");
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

// 채팅방 생성 (Callable)
exports.createChatRoom = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const myUid = context.auth.uid;
    const { targetUid } = data;

    if (!targetUid) {
        throw new functions.https.HttpsError("invalid-argument", "상대방 ID가 필요합니다.");
    }

    // 이미 존재하는 방인지 확인 (1:1 채팅 가정)
    // participants 배열에 [myUid, targetUid]가 모두 포함된 방을 찾음
    // Firestore 쿼리 한계로 인해, participants를 정렬해서 저장하거나, 복합 쿼리 사용
    // 여기서는 간단히 participants array-contains 사용 후 필터링

    const snapshot = await admin.firestore().collection("chatRooms")
        .where("participants", "array-contains", myUid)
        .get();

    let existingRoomId = null;

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(targetUid) && data.participants.length === 2) {
            existingRoomId = doc.id;
        }
    });

    if (existingRoomId) {
        return { roomId: existingRoomId, isNew: false };
    }

    // 새 방 생성
    const newRoomRef = admin.firestore().collection("chatRooms").doc();
    await newRoomRef.set({
        participants: [myUid, targetUid],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: "",
        lastMessageSenderId: "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { roomId: newRoomRef.id, isNew: true };
});